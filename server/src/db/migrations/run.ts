import fs from 'fs';
import path from 'path';
import { db } from '../client';
import { logger } from '../../utils/logger';

interface Migration {
  id: string;
  filename: string;
  sql: string;
}

class MigrationRunner {
  private migrationsDir = __dirname;

  async createMigrationsTable(): Promise<void> {
    try {
      // First check if admin_audit schema exists, if not create it
      await db.query(`
        CREATE SCHEMA IF NOT EXISTS admin_audit;
      `);
      
      // Then create the migrations table
      await db.query(`
        CREATE TABLE IF NOT EXISTS admin_audit.migrations (
          id SERIAL PRIMARY KEY,
          filename VARCHAR(255) NOT NULL UNIQUE,
          executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);
    } catch (error) {
      logger.error('Failed to create migrations table:', error);
      throw error;
    }
  }

  async getExecutedMigrations(): Promise<string[]> {
    try {
      const result = await db.query('SELECT filename FROM admin_audit.migrations ORDER BY id');
      return result.rows.map((row: any) => row.filename);
    } catch (error) {
      // If schema doesn't exist yet, return empty array
      return [];
    }
  }

  async getPendingMigrations(): Promise<Migration[]> {
    const executedMigrations = await this.getExecutedMigrations();
    const allMigrations = this.getAllMigrations();
    
    return allMigrations.filter(migration => 
      !executedMigrations.includes(migration.filename)
    );
  }

  getAllMigrations(): Migration[] {
    const files = fs.readdirSync(this.migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    return files.map(filename => ({
      id: filename.split('_')[0],
      filename,
      sql: fs.readFileSync(path.join(this.migrationsDir, filename), 'utf8')
    }));
  }

  async executeMigration(migration: Migration): Promise<void> {
    await db.transaction(async (client) => {
      logger.info(`Executing migration: ${migration.filename}`);
      
      // Execute the migration SQL
      await client.query(migration.sql);
      
      // Record the migration as executed
      await client.query(
        'INSERT INTO admin_audit.migrations (filename) VALUES ($1)',
        [migration.filename]
      );
      
      logger.info(`Migration completed: ${migration.filename}`);
    });
  }

  async rollbackMigration(migration: Migration): Promise<void> {
    logger.warn(`Rolling back migration: ${migration.filename}`);
    
    await db.transaction(async (client) => {
      // Remove from migrations table
      await client.query(
        'DELETE FROM admin_audit.migrations WHERE filename = $1',
        [migration.filename]
      );
      
      // Note: SQL rollback would need separate down migration files
      // For now, we just remove the record
      logger.warn(`Migration rollback recorded: ${migration.filename}`);
    });
  }

  async migrateUp(): Promise<void> {
    try {
      await this.createMigrationsTable();
      const pendingMigrations = await this.getPendingMigrations();
      
      if (pendingMigrations.length === 0) {
        logger.info('No pending migrations to execute');
        return;
      }
      
      logger.info(`Executing ${pendingMigrations.length} migrations`);
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      logger.info('All migrations completed successfully');
    } catch (error) {
      logger.error('Migration failed:', error);
      throw error;
    }
  }

  async migrateDown(): Promise<void> {
    try {
      const executedMigrations = await this.getExecutedMigrations();
      
      if (executedMigrations.length === 0) {
        logger.info('No migrations to rollback');
        return;
      }
      
      // Get the last executed migration
      const lastMigration = executedMigrations[executedMigrations.length - 1];
      const migration = this.getAllMigrations().find(m => m.filename === lastMigration);
      
      if (migration) {
        await this.rollbackMigration(migration);
        logger.info('Migration rollback completed');
      }
    } catch (error) {
      logger.error('Migration rollback failed:', error);
      throw error;
    }
  }
}

// CLI interface
async function main() {
  const command = process.argv[2];
  const migrationRunner = new MigrationRunner();
  
  try {
    switch (command) {
      case 'up':
        await migrationRunner.migrateUp();
        break;
      case 'down':
        await migrationRunner.migrateDown();
        break;
      default:
        console.log('Usage: ts-node run.ts [up|down]');
        process.exit(1);
    }
  } catch (error) {
    logger.error('Migration command failed:', error);
    process.exit(1);
  } finally {
    await db.close();
  }
}

if (require.main === module) {
  main();
}

export { MigrationRunner };
