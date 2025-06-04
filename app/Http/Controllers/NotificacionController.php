<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreNotificacionRequest;
use App\Http\Requests\UpdateNotificacionRequest;
use App\Models\Notificacion;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class NotificacionController extends Controller
{
    public function index()
    {
        Log::info('Accediendo a NotificacionController@index');
        $user = Auth::user();

        $notificaciones = $user->notificaciones()
            ->orderByDesc('created_at')
            ->get();

        $no_leidas = $user->notificaciones()->where('leido', false)->count();

        Log::info('Notificaciones obtenidas para el usuario ' . $user->id . ': ' . $notificaciones->count() . ' totales, ' . $no_leidas . ' no leídas.');

        return response()->json([
            'notificaciones' => $notificaciones,
            'no_leidas' => $no_leidas
        ]);
    }

    public function marcarComoLeida($id)
    {
        Log::info('Accediendo a NotificacionController@marcarComoLeida para ID: ' . $id);
        $user = Auth::user();
        if (!$user) {
            Log::warning('Intento de marcar notificación como leída sin autenticación.');
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $notificacion = $user->notificaciones()->findOrFail($id);
            if (!$notificacion->leido) {
                $notificacion->leido = true;
                $notificacion->save();
                Log::info('Notificación ID ' . $id . ' marcada como leída exitosamente para el usuario ' . $user->id);
            } else {
                Log::info('Notificación ID ' . $id . ' ya estaba marcada como leída.');
            }
            return response()->json(['success' => true]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Notificación ID ' . $id . ' no encontrada o no pertenece al usuario ' . $user->id . '. Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Notificación no encontrada o no autorizada.'], 404);
        } catch (\Exception $e) {
            Log::error('Error al marcar notificación ID ' . $id . ' como leída: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error interno del servidor.'], 500);
        }
    }

    public function marcarTodasComoLeidas()
    {
        Log::info('Accediendo a NotificacionController@marcarTodasComoLeidas');
        $user = Auth::user();
        if (!$user) {
            Log::warning('Intento de marcar todas las notificaciones como leídas sin autenticación.');
            return response()->json(['success' => false, 'message' => 'No autenticado.'], 401);
        }

        try {
            $count = $user->notificaciones()->where('leido', false)->update(['leido' => true]);
            Log::info($count . ' notificaciones marcadas como leídas para el usuario ' . $user->id);
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Error al marcar todas las notificaciones como leídas para el usuario ' . $user->id . ': ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Error interno del servidor.'], 500);
        }
    }
}
