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
        $user = Auth::user();

        $notificaciones = $user->notificaciones()
            ->orderByDesc('created_at')
            ->get();

        $no_leidas = $user->notificaciones()->where('leido', false)->count();

        return response()->json([
            'notificaciones' => $notificaciones,
            'no_leidas' => $no_leidas
        ]);
    }

    public function marcarComoLeida($id)
    {
        $user = Auth::user();

        $notificacion = $user->notificaciones()->findOrFail($id);
        if (!$notificacion->leido) {
            $notificacion->leido = true;
            $notificacion->save();
        }
        return response()->json(['success' => true]);
    }

    public function marcarTodasComoLeidas()
    {
        $user = Auth::user();

        $count = $user->notificaciones()->where('leido', false)->update(['leido' => true]);
        return response()->json(['success' => true]);
    }
}
