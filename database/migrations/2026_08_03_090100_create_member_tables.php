<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('member_code')->unique();
            $table->string('full_name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->enum('gender', ['male', 'female'])->default('male');
            $table->date('date_of_birth')->nullable();
            $table->text('address')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('photo')->nullable();
            $table->enum('status', ['active', 'inactive', 'frozen', 'expired'])->default('inactive');
            $table->text('notes')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('member_qr_codes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('qr_token')->unique();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('membership_packages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('duration_days');
            $table->decimal('price', 12, 2);
            $table->decimal('registration_fee', 12, 2)->default(0);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });

        Schema::create('membership_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('package_id')->constrained('membership_packages')->cascadeOnDelete();
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('price_paid', 12, 2);
            $table->enum('status', ['active', 'expired', 'frozen', 'cancelled'])->default('active');
            $table->date('freeze_start_date')->nullable();
            $table->date('freeze_end_date')->nullable();
            $table->string('freeze_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('membership_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_id')->nullable()->constrained('membership_subscriptions')->nullOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->string('transaction_code')->unique();
            $table->string('payment_method')->default('cash');
            $table->decimal('amount', 12, 2);
            $table->enum('status', ['paid', 'pending', 'failed'])->default('paid');
            $table->timestamp('paid_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->timestamp('check_in_time');
            $table->timestamp('check_out_time')->nullable();
            $table->enum('check_in_method', ['qr', 'manual', 'barcode'])->default('manual');
            $table->enum('status', ['checked_in', 'checked_out'])->default('checked_in');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
        Schema::dropIfExists('membership_transactions');
        Schema::dropIfExists('membership_subscriptions');
        Schema::dropIfExists('membership_packages');
        Schema::dropIfExists('member_qr_codes');
        Schema::dropIfExists('members');
    }
};
