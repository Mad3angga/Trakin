<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class MigrateSqliteToPgsql extends Command
{
    protected $signature = 'db:migrate-from-sqlite {--sqlite-path=database/database.sqlite : Path to the SQLite database file}';
    protected $description = 'Migrate all data from SQLite database to PostgreSQL';

    public function handle()
    {
        $sqlitePath = base_path($this->option('sqlite-path'));

        if (!file_exists($sqlitePath)) {
            $this->error("SQLite file not found at: {$sqlitePath}");
            return 1;
        }

        $this->info("Connecting to SQLite database: {$sqlitePath}");
        config(['database.connections.sqlite_source' => [
            'driver' => 'sqlite',
            'database' => $sqlitePath,
            'prefix' => '',
            'foreign_key_constraints' => false,
        ]]);

        $targetConnection = DB::getDefaultConnection();
        $this->info("Target connection is: {$targetConnection}");

        if ($targetConnection === 'sqlite') {
            $this->error("Target connection is still sqlite! Please set DB_CONNECTION=pgsql in .env first.");
            return 1;
        }

        // Ordered list of tables to migrate respecting foreign keys
        $tables = [
            'branches',
            'users',
            'permissions',
            'roles',
            'model_has_permissions',
            'model_has_roles',
            'role_has_permissions',
            'settings',
            'activity_logs',
            'membership_packages',
            'members',
            'member_qr_codes',
            'membership_subscriptions',
            'membership_transactions',
            'trainers',
            'trainer_availabilities',
            'classes',
            'class_schedules',
            'class_registrations',
            'pt_packages',
            'pt_subscriptions',
            'pt_sessions',
            'product_categories',
            'products',
            'sales',
            'sale_items',
            'suppliers',
            'purchase_orders',
            'purchase_order_items',
            'stock_movements',
            'stock_adjustments',
            'expenses',
            'payment_methods',
            'payment_transactions',
            'notifications',
            'trainer_client_messages',
            'attendances',
        ];

        $this->info("Starting data migration to {$targetConnection}...");

        $driver = DB::connection()->getDriverName();

        // Temporarily disable foreign keys if PostgreSQL
        if ($driver === 'pgsql') {
            DB::statement("SET session_replication_role = 'replica';");
        }

        $totalMigrated = 0;

        foreach ($tables as $table) {
            if (!Schema::connection('sqlite_source')->hasTable($table)) {
                $this->line("  - Skipping <comment>{$table}</comment> (not found in SQLite)");
                continue;
            }

            if (!Schema::hasTable($table)) {
                $this->warn("  ! Skipping <comment>{$table}</comment> (not found in target schema)");
                continue;
            }

            $rows = DB::connection('sqlite_source')->table($table)->get()->map(function ($row) {
                return (array) $row;
            })->toArray();

            $count = count($rows);
            if ($count === 0) {
                $this->line("  - <info>{$table}</info>: 0 rows");
                continue;
            }

            // Truncate target table
            DB::table($table)->truncate();

            // Insert in chunks of 100
            foreach (array_chunk($rows, 100) as $chunk) {
                DB::table($table)->insert($chunk);
            }

            // Reset PostgreSQL auto-increment sequence
            if ($driver === 'pgsql') {
                try {
                    $hasId = Schema::hasColumn($table, 'id');
                    if ($hasId) {
                        $maxId = DB::table($table)->max('id') ?: 1;
                        DB::statement("SELECT setval(pg_get_serial_sequence('{$table}', 'id'), {$maxId}, true)");
                    }
                } catch (\Throwable $e) {
                    // Ignore sequence reset if column is not serial
                }
            }

            $totalMigrated += $count;
            $this->info("  ✓ Migrated <info>{$table}</info>: {$count} rows");
        }

        // Re-enable foreign keys
        if ($driver === 'pgsql') {
            DB::statement("SET session_replication_role = 'origin';");
        }

        $this->newLine();
        $this->info("★ Migration completed successfully! Total records migrated: {$totalMigrated}");
        return 0;
    }
}
