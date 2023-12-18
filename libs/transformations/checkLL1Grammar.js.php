<?php
header('Content-Type: application/javascript');

$c = file_get_contents("http://www.physiotherapie-friedersdorf.de/FLACI/checkLL1Grammar.js");
file_put_contents("checkLL1Grammar.js",$c);

print $c;

