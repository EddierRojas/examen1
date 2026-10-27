<?php

use App\Models\Categoria;
use App\Models\Equipo;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    Sanctum::actingAs(User::factory()->create());
});

it('crea un equipo y responde 201 con el encabezado Location', function () {
    $categoria = Categoria::factory()->create();
    $datos = [
        'codigo' => 'EQ-9753',
        'nombre' => 'Laptop de pruebas',
        'categoria_id' => $categoria->id,
        'estado' => 'disponible',
        'fecha_adquisicion' => '2026-09-15',
        'costo_interno' => 85000,
    ];

    $respuesta = $this->postJson('/api/equipos', $datos)
        ->assertCreated()
        ->assertJsonPath('data.codigo', 'EQ-9753')
        ->assertJsonPath('data.categoria.id', $categoria->id);

    $equipo = Equipo::where('codigo', 'EQ-9753')->firstOrFail();
    $respuesta->assertHeader('Location', route('equipos.show', $equipo));
    $this->assertDatabaseHas('equipos', ['codigo' => 'EQ-9753']);
});

it('rechaza un equipo con datos inválidos y responde 422 con errores por campo', function () {
    $this->postJson('/api/equipos', [
        'codigo' => 'INCORRECTO',
        'nombre' => 'A',
        'categoria_id' => 999999,
        'fecha_adquisicion' => '2099-01-01',
        'costo_interno' => -1,
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'codigo', 'nombre', 'categoria_id', 'fecha_adquisicion', 'costo_interno',
        ]);
});

it('impide eliminar un equipo prestado y responde 409', function () {
    $equipo = Equipo::factory()->prestado()->create();

    $this->deleteJson("/api/equipos/{$equipo->id}")
        ->assertStatus(409)
        ->assertJson([
            'mensaje' => 'No se puede eliminar un equipo prestado.',
            'codigo' => 'REGLA_NEGOCIO',
        ]);

    $this->assertDatabaseHas('equipos', ['id' => $equipo->id, 'estado' => 'prestado']);
});
