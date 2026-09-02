<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->string('payment_method')->default('cash')->after('amount');
            $table->string('receipt_photo')->nullable()->after('expense_date');
            $table->text('notes')->nullable()->after('receipt_photo');
        });

        Schema::table('pt_subscriptions', function (Blueprint $table) {
            $table->decimal('price_paid', 12, 2)->default(0)->after('remaining_sessions');
            $table->string('payment_method')->default('cash')->after('price_paid');
            $table->enum('payment_status', ['paid', 'pending', 'cancelled'])->default('paid')->after('payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'receipt_photo', 'notes']);
        });

        Schema::table('pt_subscriptions', function (Blueprint $table) {
            $table->dropColumn(['price_paid', 'payment_method', 'payment_status']);
        });
    }
};
