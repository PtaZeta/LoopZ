<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Verificación</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #1f2937;
            background: linear-gradient(to bottom, #1f2937, #000000);
            color: #e0e0e0;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
        }
        .container {
            background-color: #2a2a4a;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
            padding: 30px;
            max-width: 500px;
            width: 90%;
            text-align: center;
        }
        .logo-container {
            text-align: center;
            margin-bottom: 20px;
        }
        .logo {
            max-width: 150px;
            height: auto;
            border-radius: 5px;
        }
        h1 {
            color: #4CAF50;
            font-size: 28px;
            margin-bottom: 20px;
            text-shadow: 0 0 10px rgba(76, 175, 80, 0.5);
        }
        p {
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 15px;
        }
        .code-box {
            background: linear-gradient(45deg, #2196F3, #9C27B0);
            padding: 15px 25px;
            border-radius: 5px;
            display: inline-block;
            margin: 25px 0;
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 3px;
            color: #ffffff;
            box-shadow: 0 0 20px rgba(33, 150, 243, 0.6);
            text-shadow: 0 0 8px rgba(255, 255, 255, 0.7);
        }
        .info-text {
            font-size: 14px;
            color: #9E9E9E;
            margin-top: 20px;
        }
        .footer-text {
            font-size: 12px;
            color: #616161;
            margin-top: 30px;
        }
        a {
            color: #2196F3;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo-container">
            <img src="{{ asset('logo.png') }}" alt="LoopZ Logo" class="logo">
        </div>
        <h1>¡Afina tu cuenta, {{ $nombre_usuario }}!</h1>
        <p>¡Bienvenido a LoopZ, donde cada 'like' suena! Para activar tu cuenta y empezar a descubrir nuevos ritmos, hemos generado un código de verificación único.</p>
        <p>Aquí tienes tu código para activar tu cuenta y sumergirte en la música:</p>
        <div class="code-box">
            {{ $codigo }}
        </div>
        <p class="info-text">Este código es tu pase VIP y es válido durante 10 minutos. ¡Mantén el ritmo, no lo compartas con nadie!</p>
        <p class="info-text">Si no esperabas este código, no hay problema, simplemente ignora este correo.</p>
        <p class="footer-text">¡A rockear,<br><b>LoopZ</b></p>
    </div>
</body>
</html>
