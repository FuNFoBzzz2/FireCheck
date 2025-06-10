<?php 
include("control/path.php"); 
include("control/users.php");

if (isset($_GET['i'])) {
    $i = (int)$_GET['i'];
    // $_SESSION['user'][$i]['party'] = 0;
    // delete_invite($i);
} 
?>  
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Refresh" content="10">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/style.css">
    <title>Правила русских шашек</title>
    <script>
        window.addEventListener('beforeunload', function (event) {
            navigator.sendBeacon('remove_session.php');
        });
    </script>
</head>
<body>
    <div class="centr-form">
        <form method="POST" action="">
            <input type="hidden" name="id_index" value="<?php echo $i; ?>">
        </form>
        <div class="container">
            <div class="header">
                <div class="setting">
                    <a href="<?php echo BASE_URL . '?i=' . $i; ?>" class="href">Выход</a>
                </div>
                <div></div>
            </div>
            <div class="rules">
                <h1>Правила русских шашек</h1>
                <p>Игровое поле представляет собой квадратную доску размером 8x8 клеток, подобную шахматной. В отличие от шахмат игровыми считаются не все, а только темные поля.</p>
                <p>Шашки занимают первые три ряда с каждой стороны. Противники ходят поочередно, перемещая шашки своего цвета по игровым полям.</p>
                <p>Первыми начинают белые. Бить можно произвольное количество шашек в любых направлениях. Простая шашка ходит только вперед, но может бить назад. Дамка может ходить на любое число полей.</p>
                <p>Цель игры - съесть или запереть все шашки противника.</p>
                <p>Возникающие на доске ситуации называют позициями, или положениями. Проведенная от начала и до завершения игра называется партией, а передвижения шашек - ходами.</p>
                <p>Выигрывает та сторона, которой удалось уничтожить или заблокировать движение всех шашек противника.</p>
            </div>
        </div>
    </div>
</body>
</html>