<?php include("control/path.php"); 
    include("control/users.php");
    if(isset($_GET['i'])){
        $i = (int)$_GET['i'];
    }
?>  
<!DOCTYPE html>
<html lang="ru">
<head>
 <meta charset="UTF-8">
 <meta name="viewport" content="width=device-width, initial-scale=1.0">
 <!-- <meta http-equiv="Refresh" content="10"> -->
 <link rel="stylesheet" href="assets/customof.css">
 <title>Шашки</title>
 
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="setting">
                <a href="<?php echo BASE_URL . '?i=' . $i; ?>" class="href" >Назад</a>
            </div>
        </div>
        <div class="board" id="board"></div>
        <script src="assets/scriptof.js"></script>
    </div>
</body>
</html>