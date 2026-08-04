<?php

namespace Tests\Unit;

use App\Models\TenagaMedis;
use Tests\TestCase;

class TenagaMedisRelationshipTest extends TestCase
{
    public function test_wilayah_layanan_relationship_uses_correct_keys(): void
    {
        $relation = (new TenagaMedis())->wilayahLayanan();

        $this->assertSame('id_wilayah_layanan', $relation->getForeignKeyName());
        $this->assertSame('id_wilayah_layanan', $relation->getOwnerKeyName());
    }
}
