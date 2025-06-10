<?php
// Запросы к БД при помощи PHP (PDO)
require_once 'setting.php';
// Подключение к MySQL
$groove='mysql';
$option = [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC];
try{
    $pdo = new PDO(
        "$groove:host=$host;dbname=$database",
        $db_user, $db_pass, $option);
}catch (PDOException $i){
    die('Ошибка подключения к базе данных');
}
// $name = 'Arnold';
// $password = 4543;
// $mail = 'user@sdg';
// $sql = "INSERT users (name, password, mail) VALUE (:n, :pas, :m)";
// $query = $connection->prepare($sql);
// $query->execute(['n'=>$name,'pas'=>$password,'m'=>$mail]);