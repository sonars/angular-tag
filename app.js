var app = angular.module('example', ['angular-tag']);

function stringToTagObject($string) {
    $array = [];
    $string = $string.split(',');
    $.each($string, function(i, v) {
        let obj = { text: v };
        $array.push(obj);
    })
    return $array;
}

function tagObjectToString($tag) {
	$string = '';
    $.each($tag, function(i, v) {
        $string += v.text + ',';
    });    
    return $string.substring(0, $string.lastIndexOf(','));
}

app.controller('MainCtrl', function($scope) {
    var rawData = 'nani,adfaf,fa,a,af,f,fa,a';
    $scope.data = stringToTagObject(rawData);


    $scope.selected = [];

    $scope.max = 2; //set the maximum number of tag entry 
    // $scope.delimiter = [",", "x", "-"];

    $scope.tagUpdated = function(event) {
        console.log("Event:" + event.action);
        console.log(event.item);
    };
    $scope.getTagData = function() {
        selectedItems = $scope.selectedi;
        
        console.log(tagObjectToString(selectedItems));

    }
});
