<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EcommerceOrder extends Model
{
    protected $fillable = ['ecommerce_store_id', 'external_order_id', 'customer_name', 'total_amount', 'currency', 'status'];

    public function store()
    {
        return $this->belongsTo(EcommerceStore::class, 'ecommerce_store_id');
    }
}
