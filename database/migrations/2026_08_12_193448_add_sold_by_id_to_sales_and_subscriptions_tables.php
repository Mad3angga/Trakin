<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;

return new class extends Migration
{
    public function up(): void
    {
        try {
            Role::firstOrCreate(['name' => 'Sales', 'guard_name' => 'web']);
        } catch (\Throwable $e) {}

        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('sold_by_id')->nullable()->after('cashier_id')->constrained('users')->nullOnDelete();
        });

        Schema::table('membership_subscriptions', function (Blueprint $table) {
            $table->foreignId('sold_by_id')->nullable()->after('price_paid')->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['sold_by_id']);
            $table->dropColumn('sold_by_id');
        });

        Schema::table('membership_subscriptions', function (Blueprint $table) {
            $table->dropForeign(['sold_by_id']);
            $table->dropColumn('sold_by_id');
        });
    }
};
