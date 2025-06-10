<?php
session_start();
require('connect.php');
// $_SESSION['user'] = [];
function con($value){
    echo '<pre>';
    print_r($value);
    echo '</pre>';
}
function CheckError($query){
    $errInfo = $query->errorInfo();
    if($errInfo[0] != PDO::ERR_NONE){
        echo $errInfo[2];
        exit();
    }
    return true;
}

function selectOne($table, $params =[]){
    global $pdo;
    $sql = "SELECT * FROM $table";
    if(!empty($params)){
        $i =0;
        foreach ($params as $key => $value){
            if(!is_numeric($value)){
                $value = "'".$value."'";
            }
            if($i===0){
                $sql = $sql . " Where $key = $value";
            } else {
                $sql = $sql . " AND $key = $value";
            }
            $i++;
        }
    }
    // con($sql);
    // exit;
    // $sql = "Select * from $table";
    $query = $pdo->prepare($sql);
    $query->execute();
    CheckError($query);
    return $query->fetch();
}
function selectAll($table){
    global $pdo;
    $sql = "SELECT * FROM $table";
    $query = $pdo->prepare($sql);
    $query->execute();
    CheckError($query);
    return $query->fetchAll();
}
// $params = [
//     'name' => 'Kir',
//     'wins' => 8
    
// ];
function insert($table, $params){
    global $pdo;
    $i=0;
    $coll='';
    $mask='';
    foreach ($params as $key =>$value){
        if ($i===0){
            $coll=$coll . "$key";
            $mask=$mask ."'". "$value"."'";
        } else{
            $coll=$coll . ", $key";
            $mask=$mask .", '". "$value"."'";
        }
        $i++;

    }
    $sql = "INSERT INTO $table ($coll) VALUES ($mask)";
    // con($sql);
    // exit;
    $query = $pdo->prepare($sql);
    // $query->execute($params);
    $query->execute();
    CheckError($query);
    return $pdo->lastInsertId();
    // return $query->fetchAll();
}

function update($table, $id ,$params){
    global $pdo;
    $i=0;
    $str = ''; 
    foreach ($params as $key =>$value){
        if ($i===0){
            $str=$str. $key ." = '". $value."'";
        } else{
            $str=$str. ", ". $key ."= '". $value."'"; 
        }
        $i++;
    }
    $sql = "UPDATE $table SET $str WHERE ID=$id";
    // con($sql);
    // exit;
    $query = $pdo->prepare($sql);
    // $query->execute($params);
    $query->execute();
    CheckError($query);
    return $query->fetchAll();
}
function delete($table, $id){
    global $pdo;
    $sql = "DELETE FROM $table WHERE ID=$id";
    // con($sql);
    // exit;
    $query = $pdo->prepare($sql);
    // $query->execute($params);
    $query->execute();
    CheckError($query);
    return $query->fetchAll();
}
// con(selectOne('users', $params));
// $arrData = [ 
//     'wins'=>'0',
//     'lose'=>'11'
// ];
// delete('users', 16);
?>