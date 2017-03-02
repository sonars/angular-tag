/**
 * Created on 7/16/2016.
 * Theophilus Omoregbee <theo4u@ymail.com>
 */

/**
 * Tag input allows input from client and this input objects must contain the
 * 'text' field or use the data-field='field_in_ur_array_or_object' to specify which field you want us to use
 * i.e data set =[ {text:'View', value:'value1'[,..:...]}, {text:'View', value:'value2'[,..:...]}, ....]
 * where the text is used in displaying the content to users and checking if the text matches any data set
 * field to add to our selected tag as return array of objects
 *
 *
 * it generates a default view for the entered input when the allow outside data set is used , if it exist on our
 * data set use the object in the data set and add it to our selected data set
 * else if  not in our data set then use the $scope.default_input={text:input}
 *
 * required is only triggered when the required field is true and the selected tag is empty throw required on the input
 * name is specified so as to alert the form that the input with the name is needed
 *
 * Ability to style it , but comes with two styled themes
 *          1. Material
 *          2. Default
 *
 * The directive calls some few events
 *          1. tag-added calls the onTagAdded with the added item to the parent method as parameter which is the a child in the event
 *          2. tag-removed calls the onTagRemoved with the removed item to the parent method as parameter which is the a child in the event
 *          3. tag-active same happens it notifies the user via the onTagActive function with the event containing the item
 *          4. tag-maximum same as above this is calls onTagMaximum when the selected tags count hits its maximum specified in the $scope.max
 *
 * Delimiter can be array of delimiters[default=','] or enter key which is default for the system to use despite the delimiters
 * Max helps in monitoring how many tag is added or selected
 *
 * You can delete tag by Either
 *          1. Backspace
 *          2. Delete
 *
 *  Type Head features
 *         1. normal type head which is based on the data set , as user types it opens the type head for assistance
 *             it is triggered by default, users can decide to off it , by turning it to false
 *        2. For type head animation just inject ngAnimate
 */

(function () {

      /**
     * This method takes in a variable to determine if the variable was initialized or null then use the default specified
     * @param variable
     * @param default_value
     * @returns {*}
     */
    var data_init=function (variable,default_value) {

        if(variable === undefined || variable === null)
            return default_value;
        else
            return variable;
    };

    /**
     * Our Controller for the tags-input
     * @param $scope
     * @param $filter
     */
    var controllerFunction=function ($scope,$filter,$log,$timeout) {
        $scope.hasError=false;//when there is error while entrying record
        $scope.delimiter=data_init($scope.delimiter,[',']);//used in specifying which separator to use or use default ,
        $scope.data = data_init($scope.data,[]);
        $scope.selected=data_init($scope.selected,[]);
        $scope.allowOutsideDataSet=data_init($scope.allowOutsideDataSet,false);
        $scope.sameInput=data_init($scope.sameInput,false);
        $scope.default_input={};//default view when a new object is added i.e when
        $scope.theme=data_init($scope.theme,'default');
        $scope.typehead=data_init($scope.typehead,true);//used in displaying type head or not
        $scope.displayField=data_init($scope.displayField,'text');//used in displaying which field inside the data set we need
        $scope.placeholder=data_init($scope.placeholder,'Enter Text with , separated');//this is helps for custom placeholder
        $scope.max=data_init($scope.max,undefined);//this is helps to allow infinity value of input tag by default
        $scope.required=data_init($scope.required,false);
        $scope.name=data_init($scope.name,'tagMe');//used in getting the name of our input field

        $scope.active_index=-1;//this hold the active selected tag index
        $scope.typeheadOpened=false;//notify and holds the true or false , depending when the typehead options is showed for selection


        /**
         * This method checks if an item(input) exist inside an array
         * @param array
         * @param input
         * @returns {*}
         */
        $scope.check_data=function (array,input) {
            return $filter('filter')(array, function(value, index) {return value[$scope.displayField] == input;})[0];
        };

        /**
         * This method strips off any delimiter in our input and return a refined input with no delimiter
         * @param input the input to strip delimiter of
         * @returns {*}
         */
        $scope.strip_delimiters=function (input) {
            var n=$scope.delimiter.length;
           for(var i=0;i<n;i++)
               input=input.replace($scope.delimiter[i],'');
            return input;//stripped input with no delimiter
        };

        /**
         * This method checks if there exist a delimiter in our input
         * @param input to work on
         * @returns {boolean} returns either true or false , if found true else false
         */
        $scope.check_delimiter=function (input) {
            var n=$scope.delimiter.length;
            //$log.log("Size:"+n+"--"+$scope.delimiter);
            for(var i=0;i<n;i++)
                if(input.indexOf($scope.delimiter[i]) > -1 )
                    return true;
            return false;
        };

        /**
         * on key up call this function to help process our tag input
         */
        $scope.on_input_keyup=function (event) {
            var input='';
            if($scope.input !== undefined)
                input=$scope.strip_delimiters($scope.input);
                    //$log.log("striped input:"+input);
            //if user just type and uses our defined delimiter do this function
            if ($scope.input !== undefined && $scope.check_delimiter($scope.input) === true) {
                if(input!=="")
                    $scope.processor(input);
                return 0;
            }

            //if user types and presses enter key (keyCode 13 ASCII)
            if(event.keyCode === 13 && input !== "" ) {
                   $scope.processor(input);
                return 0;
            }


         //let's check if the user pressed the backspace button so we know when to enter the tag after the input i.e activate the tag as active
         //and check if the backspace is pressed and nothing to backspace then move to our last added tag
            if(event.keyCode === 8 && input.slice(0,$scope.getCursorPosition(event.target)) === "" ){
               // $log.info("backspace activated");
                var last_index=$scope.selected.length-1;
                //if backspace is clicked twice with input empty delete
                if(last_index === $scope.active_index) {
                    $scope.remove($scope.selected[$scope.active_index]);
                    last_index = -1;
                }

                $scope.moveToTag(event,last_index);//-1 means move the tag to the last tag
                return 0;
            }

             
            //when the user clicked on the delete button removed the active one and if the input field delete action is dummant i.e
            //when user press it no text to remove from behind again
            if(event.keyCode === 46 && input.slice($scope.getCursorPosition(event.target),input.length) === ""){
                $scope.remove($scope.selected[$scope.active_index]);
            return 0;
            }

        };

        /**
         * This method is to help navigate between or added tags when the key arrow left,down,up and right is pressed
         * and this works with only the keypress down event
         * @param event
         */
    $scope.on_input_keydown=function (event) {
        var input='';
        if($scope.input !== undefined)
            input=$scope.input.replace($scope.delimiter,'');

        //when user press the directional key left check if the cursor position is at the extreme left of the input field
        if(event.keyCode === 37 && $scope.getCursorPosition(event.target) === 0){
            var last_index = ($scope.active_index===-1)|| ($scope.active_index===0)?($scope.selected.length-1):($scope.active_index-1);
            $scope.moveToTag(event,last_index);
            return;
        }

        //when user press the directional key right check if the cursor position is at the extreme right of the input field
        if(event.keyCode === 39 && $scope.getCursorPosition(event.target) === input.length){
            var first_index = ($scope.active_index===-1) || ($scope.active_index===($scope.selected.length-1))?(0):($scope.active_index+1);
            $scope.moveToTag(event,first_index);
            return 0;
        }

        // when the user press the down button and typehead is true activate our type head to show and move down the list
        if(event.keyCode === 40 && $scope.typehead === true){
            $scope.typeheadOpened=true;//open the typehead
            var active=$scope.getActiveTypeHead(event);
            var first_index = (active === -1) || (active === ($scope.data.length-1))?(0):(active + 1);
            $scope.moveToTagTypeHead(event,first_index);
            return 0;
        }

        // when the user press the up button and typehead is true activate our type head to show
         if(event.keyCode === 38 && $scope.typehead === true){
                $scope.typeheadOpened=true;//open the typehead
                return 0;
         }


    };

        /**
         * This function is fired to help handle on blur on our input which should only occur when the user loses focus on the input
         * this helps handle when the user loses focus just wait small and close it and when user click on it dont hide it on time wait for
         * specified time
         */
    $scope.onblur=function () {
        $timeout(function () {
            $scope.typeheadOpened=false;
            $scope.isFocus=false;
        },300);
    };

        /**
         * Thanks to Dasari Srinivas http://blog.sodhanalibrary.com/2015/02/get-cursor-position-in-text-input-field.html#.V5Ly47grK00
         *  This method helps in getting the cursor position in our text field so we can check if there was something
         * @param oField which is the html field our text field in this case
         * @returns {number}
         */
        $scope.getCursorPosition=function(oField) {

            // Initialize
            var iCaretPos = 0;

            // IE Support
            if (document.selection) {

                // Set focus on the element
                oField.focus ();

                // To get cursor position, get empty selection range
                var oSel = document.selection.createRange ();

                // Move selection start to 0 position
                oSel.moveStart ('character', -oField.value.length);

                // The caret position is selection length
                iCaretPos = oSel.text.length;
            }

            // Firefox support
            else if (oField.selectionStart || oField.selectionStart === '0')
                iCaretPos = oField.selectionStart;

            // Return results
           return iCaretPos;
        };

        /**
         * this method updates our tag view with the input parameter, and pass an event to the parent that an object is gotten
         * and it checks if the max is specified i.e if the maximum tags is reached or if not specified it should allow tags till infinity
         *
         * it sends two event when the a tag is added and when the selected tags hits maximum allowed
         * @param input
         */
        $scope.update=function (input) {
            if($scope.selected.length<$scope.max || $scope.max===undefined) {
                $scope.selected.push(angular.copy(input));
                $scope.input = "";
                $scope.typeheadOpened=false;
                $scope.hasError = false;
                var event_temp = {action: 'added', item: input};
                $scope.onTagAdded({event: event_temp});
            }else{
                $scope.hasError = true;
                var event = {action: 'maximum', item: input};
                $scope.onTagMaximum({event: event});
            }
        };

        /**
         * This method removes the item from our selected tags, and it broadcast an event that an element has been removed to its parent
         * @param item
         */
        $scope.remove=function (item) {
            $scope.selected=$filter('filter')($scope.selected, function(value, index) {return value !== item;});
            $scope.active_index=-1;
            var event={action:'removed', item:item};
            $scope.onTagRemoved({event:event});
        };


        /**
         * This method check if data check is defined , if it is defined , so we know if the entered item is in our data_set or not
         * @param data_check
         * @param input
         * @returns {*}
         */
        $scope.return_value=function (data_check,input) {
            if(data_check === undefined){
                $scope.default_input[""+$scope.displayField]=input;
                return $scope.default_input;
            }else
               return data_check;//means is on our data set , so pick the item from there
        };

        /**
         * This method moves the cursor to the tag in a particular index  of our event which holds the parent and set it to be active
         * @param event
         * @param index
         */
        $scope.moveToTag = function (event,index) {
            var lis=angular.element(event.target.parentNode.parentNode).find('li');
            var size=lis.length;
            for(var i=0; i<size-1;i++){
                if(i===index) {
                    //check if it contains active before then toggle
                    if($scope.active_index !== index) {
                        $scope.active_index = index;
                        angular.element(lis[i]).addClass('active');
                        var event_temp={action:'active', item:$scope.selected[$scope.active_index]};
                        $scope.onTagActive({event:event_temp});
                    }else{
                        $scope.active_index = -1;
                        angular.element(lis[i]).removeClass('active');
                    }
                }else
                    angular.element(lis[i]).removeClass('active');
            }
        };

        /**
         * This method moves the cursor to the tag typehead in a particular index  of our event which holds the parent and set its class to be active
         * @param event
         * @param index
         */
        $scope.moveToTagTypeHead = function (event,index) {
           var main_tag=angular.element(event.target.parentNode.parentNode.parentNode.parentNode).find('ul')[1];//get the parent (div.main-tag ul)[1]
            var lis=angular.element(main_tag).find('a');
            var size=lis.length;
            for(var i=0; i<size;i++)
                if(i===index) {
                    //check if it contains active before then toggle
                    angular.element(lis[i]).addClass('active');
                }else
                    angular.element(lis[i]).removeClass('active');

        };

        /**
         *  This method helps in going through our type head to get the active index and return the index of it or return -1 for not found
         * @param event
         * @return {number} -1 for not found >-1 for found index
         */
        $scope.getActiveTypeHead=function (event) {
            var main_tag=angular.element(event.target.parentNode.parentNode.parentNode.parentNode).find('ul')[1];//get the parent (div.main-tag ul)[1]
            var lis=angular.element(main_tag).find('a');
            var size=lis.length;
            for(var i=0; i<size-1;i++)
                if(angular.element(lis[i]).hasClass('active'))
                    return i; // is the active one

            return -1;//no active
        };

        /**
         * when the user type in the field it should call this function for checking
         *
         * which would check if the following instructions
         *  1. allowOutsideDataSet
         *  2. sameInput
         *  3. hasError
         */
        $scope.processor=function (input) {

                //lets check if it is inside our main data
                var data_set_check = $scope.check_data($scope.data,input);

                //lets check if it is inside our selected data set
                var selected_set_check = $scope.check_data($scope.selected,input);

                //scenarios: when allowed outside data set and same input should be allowed
                if($scope.allowOutsideDataSet && $scope.sameInput)
                {
                    $scope.update($scope.return_value(data_set_check,input));
                    return;
                }


                //scenarios: when allowed outside data set and same input is not set
                if($scope.allowOutsideDataSet && !$scope.sameInput)
                {

                    //then check for match in our selected data set
                    if(selected_set_check === undefined)
                        $scope.update($scope.return_value(data_set_check,input));
                    else
                        $scope.hasError=true;

                    return;
                }

                //scenarios: when allowed outside data set is not set and not allowing same input
                if(!$scope.allowOutsideDataSet && !$scope.sameInput)
                {
                    //then check for match in our selected data set and our main data set
                    if(data_set_check !== undefined && selected_set_check === undefined)
                        $scope.update(data_set_check);
                    else
                        $scope.hasError=true;

                    return;
                }

                //scenarios: when allowed outside data set is not set and allowing same input
                if(!$scope.allowOutsideDataSet && $scope.sameInput)
                {
                    //then check for match in our selected data set and our main data set
                    if(data_set_check !== undefined)
                        $scope.update(data_set_check);
                    else
                        $scope.hasError=true;

                    return;
                }

                $scope.hasError=true;
                $log.error("Error, Existing before in our output , or not among data set");
            };


    };


    //inject into our controller required dependencies
    controllerFunction.$inject=['$scope','$filter','$log','$timeout'];


    var directive = function () { 
        return {
            restrict: 'E',
            require:'?^^form',//optoinal form incase the user wants required checking
            scope: {
                type: '@',
                theme:'@',//help to get theme to use in manipulating tag via
                data: '=?',//if set , is where we use in our data set to check if the entered item match any of the fields/items in it
                selected:'=',//return the selected item(s)/tags here
                sameInput:'=?',//to allow same input , that is a selected item can appear more than once in our tagging system
                allowOutsideDataSet:'=?',//if the allowed input should be outside the data set specified
                typehead:'=?',//used in turning type head to assist users when typing or not
                displayField:'@',//field to display to the user in the data set to the tag view
                placeholder:'@',//assist users so they can use their place holders , if not placed it wud use the default
                delimiter:'=?',//delimiter to separate the text entered which is an array of delimiters
                onTagAdded:'&',//event is passed via to the function to the directive to be called anytime u add a tag
                onTagRemoved:'&',//event is passed via to the function to the directive to be called anytime we remove from the tag
                onTagActive:'&',//event is passed via to the function to the directive to be called anytime a tag is active
                max:'=?',//max tag that can be allowed
                onTagMaximum:'&',//event called when the tag hits its maximum number of allowable input
                required:'=?',//default false.if the input is required or not , and this is used when the input is empty and the selected is empty
                name:'@'//is needed when the required is set true
            },
            templateUrl: function(elem, attr){
                return 'angular-tag/templates/'+attr.type+'.html';
            },
            controller: controllerFunction, //Embed a custom controller in the directive
            link: function ($scope, element, attrs, form) {
                var our_input = angular.element(element.find("input")[0]);
                    $scope.form = data_init(form,undefined);//keep our parent form here if it is specified

               our_input.bind('keyup', function ($event) { //check our input as they type for validity
                   //here we bind form validity  if required is true
                   if($scope.required && $scope.selected.length===0) //the form is invalid here
                       if($scope.form){ //if the form
                           $scope.form[our_input.attr("name")].$setValidity('required', false);
                       }
               });



            } //DOM manipulation
        };
    };

    /**
     * This directive helps to manipulate the text input to make it focusable
     * @returns {{restrict: string, link: link}}
     */
    var directive_focus=function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.$watch(attrs.focusMe, function(value) {
                    if(value === true)
                        element[0].focus();
                });
            } //DOM manipulation
        };
    };


   var module=angular.module('angular-tag',['angular-tag/templates']);
    module.directive('tagMe', directive)
          .directive('focusMe',directive_focus) ;
}());

angular.module('angular-tag/templates', []).run(['$templateCache', function($templateCache) {$templateCache.put('angular-tag/templates/input.html','<div id="main-tag">\n<div class="tag-container">\n <ul ng-class="[\'tag\',{focus:isFocus},theme ]" ng-click="isFocus=true" ng-keydown="direction_keys($event)">\n    <li ng-repeat="select in selected" ng-click="(moveToTag($event,$index)) "  data-drop="true" data-drag="true" ng-model="selected" jqyoui-droppable="{index: {{$index}}}" jqyoui-draggable="{index: {{$index}}, insertInline: true, direction:\'jqyouiDirection\'}" data-jqyoui-options="{revert: \'invalid\'}" data-direction="{{item.jqyouiDirection}}">\n      {{select[displayField]}}  <a href="javascript:void(0)" ng-click="remove(select)">&times;</a>\n    </li>\n<li>\n    <input name="{{name}}" ng-class="{error:hasError}" ng-model="input" ng-keyup="on_input_keyup($event)" ng-keydown="on_input_keydown($event)" ng-focus="isFocus=true" ng-blur="onblur();" focus-me="isFocus"\n         type="input" placeholder="{{placeholder}}" ng-required="required && (!selected.length || selected.length==0)" >\n</li>\n </ul>\n</div>\n\n<ul class="tag-typehead" ng-show="(isFocus && input.length && typehead && results.length) || (typehead && typeheadOpened) " >\n    <li class="animate-repeat" ng-repeat="item in data | filter:input as results">\n       <a href="javascript:void(0)" ng-click="processor(item[displayField])">{{item[displayField]}}</a>\n    </li>\n    <!--<li class="animate-repeat" ng-if="results.length == 0">\n        <strong>No results found...</strong>\n    </li>-->\n</ul>\n</div>');}]);