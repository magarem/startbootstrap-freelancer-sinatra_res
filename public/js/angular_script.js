var mod = angular.module("myapp", ['ng-sortable','ngAnimate', 'ui.bootstrap', 'ngFileUpload', 'angular-medium-editor']);

mod.directive('onErrorSrc', function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        if (attrs.src != attrs.onErrorSrc) {
          attrs.$set('src', attrs.onErrorSrc);
        }
      });
    }
  }
});

mod.controller('navCtrl', function ($scope, $http) {

  $scope.site = {}; 

  var dataLoad = function (){
     $http.get('/maga/dataLoad').then(function(response) {
         $scope.site = response.data;             
         console.log("dataLoad - response.data:",response.data)              
     });
  }
  dataLoad();
})

mod.controller('headerCtrl', function ($scope, $http) {

  $scope.site = {}; 

  var dataLoad = function (){
     $http.get('/maga/dataLoad').then(function(response) {
         $scope.site = response.data;             
         console.log("dataLoad - response.data:",response.data)              
     });
  }
  dataLoad();
})

mod.controller('imgGridCtrl', function ($scope, $rootScope, $uibModal, $log, $http) {
    
  $scope.imgs = [];

  $scope.site = {}; 

    var dataLoad = function (){
      $http.get('/maga/dataLoad').then(function(response) {
        $scope.site = response.data;             
        console.log("dataLoad - response.data:",response.data)              
      });
    }
  dataLoad();

  $scope.barConfig = {
    onSort: function (evt){
      console.log("barconfig [evt]:",evt)
      // $http.post('/{{data}}/portfolio/ordena/'+evt.models); 

      $http({
        headers : {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8;"
        },
        method: 'POST',
        url: "/maga/portfolio/ordena",                  
        data: evt.models
      }).success(function () {})
      //   $http.post('/{{data}}/portfolio/ordena', $httpParamSerializer(evt)).
      // success(function(data){/* response status 200-299 */}).
      // error(function(data){/* response status 400-999 */});
    }
  };

  $rootScope.$on("CallDelImg", function(event, item_index){
    delImg(item_index);
  });

  $rootScope.$on("ImgChange", function(event, src, index){  
    // console.log("ImgChange - src:",src,", index:",index)
    // $scope.imgs[index].img = src
    // console.log("$scope.imgs[index].img:", $scope.imgs[index].img)
    ImgChange(index, src)
  });

  $rootScope.$on("categoriasUpdate", function(event){  
    // console.log("ImgChange - src:",src,", index:",index)
    // $scope.imgs[index].img = src
    console.log("categoriasUpdate:", event)
    categoriasUpdate()
  });

  function onlyUnique(value, index, self) { 
      return self.indexOf(value) === index;
  }
   
  var categoriasUpdate = function (){
    regex = /(<([^>]+)>)/ig
    b = []
    // $scope.imageCategories = $scope.imgs.map(function(val){return val.cat.replace(regex, "").split(",")})[0]
    $scope.imgs.forEach(function(x){
        v = x.cat.replace(regex, "").trim()              
        if (v.split(",").length > 1){
            v.split(",").forEach(function(t){
              b.push(t)  
            })                  
        }else{
          b.push(v)
        }
    })
    $scope.imageCategories = b.filter( onlyUnique )          
  }
    
  var ImgChange = function (index, src){
    console.log("ImgChange - src:",src,", index:",index)
    // $scope.imgs[index].img = src
    // console.log("$scope.imgs[index].img:", $scope.imgs[index].img)
    $scope.imgs[index].img = src
  }

  var carregaImgs = function (){
    $http.get('/maga/getdata').then(function(response) {
      $scope.imgs = response.data;             
      console.log("response.data:",response.data) 
      categoriasUpdate();
    });
  }
 
  var delImg = function(item_index){         
    console.log("item_index:",item_index)
    $scope.imgs.splice(item_index, 1)
    // function t(obj) {
    //     return obj.id != item_index;
    // }
    // $scope.imgs = $scope.imgs.filter(t);          
  };
    
  // $scope.currentImage = $scope.images[0];
  // $scope.imageCategories = [{{port_cats}}];
    
  $scope.valueSelected = function (value) {
    if (value === null) {
        $scope.catselect = undefined;
    }
  }; 

  // $scope.$on('valuesUpdated', function() {
  //    $scope.images = Service.images;
  // });

  $scope.img_add = function () {
    id_last = $scope.imgs.length;
    console.log("id_last:",id_last)
    img_new =  {  "id"     : id_last,
                  "titulo" : "Novo",
                  "img"    : "/img/portfolio/safe.png?"+id_last,
                  "txt"    : "Txt novo",
                  "nome"   : "Fidelito",
                  "site"   : "fidelis.com",
                  "data"   : "10/10/12",
                  "servico": "Programação",
                  "cat"    : ""
                }
    $scope.imgs.push(img_new)
    //Service.images.push(img_new)
    $scope.open(img_new, id_last)
    console.log(img_new)
  }; 
        
  //
  //
  // Modal
  //
  //
  $scope.animationsEnabled = true;
  $scope.open = function (item, i) {
    console.log("i:",i)
    var modalInstance = $uibModal.open({
      animation: $scope.animationsEnabled,
      windowTopClass: "portfolio-modal modal",
      templateUrl: 'myModalContent.html',
      controller: 'ModalInstanceCtrl',
      size: 'lg',
      resolve: {
        item: function () {
          return item;
        },
        i: function () {
          return i;
        }
      }
    });
  };
  
  $scope.toggleAnimation = function () {
    $scope.animationsEnabled = !$scope.animationsEnabled;
  };

  carregaImgs();
 
});


mod.controller('ModalInstanceCtrl', function ($scope, $rootScope, $uibModalInstance, $timeout, item, i) {
  $scope.item = item;
  $scope.i = i;

  $rootScope.$on("ModalClose", function(){  
      $scope.cancel();
  });

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };       
});


mod.controller('MyFormCtrl', ['$scope', '$rootScope', 'Upload', '$timeout', '$http', function ($scope, $rootScope, Upload, $timeout, $http) {
  
  $scope.up = function(){
     angular.element('#file').trigger('click');
  };

  $scope.excluir = function(item_index){
    console.log("Excluir:",item_index);      
    //Service.ex(item); 
    $http.post('/maga/portfolio/delete/'+item_index); 
    $rootScope.$emit("CallDelImg", item_index);             
    $rootScope.$emit("ModalClose", item_index);
  };    
  
  $scope.uploadPic = function(file, index) {
    console.log("file:",file,"index:",index)
    if (file == undefined) {
      Upload.upload({
        url: '/maga/portfolio/save/'+index,
        data: {item: $scope.item},      
      }); 
      ok = true       
    }else{
      if (file.size < 600000) {
        $scope.item.img = "img/portfolio/"+file.name;
        file.upload = Upload.upload({
          url: '/maga/portfolio/save/'+index,
          data: {item: $scope.item, file: file},      
        });       
        //Service.images[$scope.item.id].img = "img/portfolio/"+file.name;    
        $rootScope.$emit("ImgChange", "/img/portfolio/"+file.name, index); 
        ok = true
      }else{
        alert("Imagem muito grande.");
        ok = false
      }
    }  
    if (ok) {
      $rootScope.$emit("categoriasUpdate"); 
      alert("Documento salvo com sucesso!");
    }
    if (!file == undefined) {
        file.upload.then(function (response) {
          $timeout(function () {file.result = response.data; });
        }, function (response) {
          if (response.status > 0)
            $scope.errorMsg = response.status + ': ' + response.data;
        }, function (evt) {
          // Math.min is to fix IE which reports 200% sometimes
          file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
        });
    }
  }
}]);


mod.controller('aboutCtrl', function ($scope, $http) {

  $scope.site = {}; 

  var dataLoad = function (){
     $http.get('/maga/dataLoad').then(function(response) {
         $scope.site = response.data;             
         console.log("dataLoad - response.data:",response.data)              
     });
  }
  dataLoad();
})

mod.controller('footerCtrl', function ($scope, $http) {

  $scope.site = {}; 

  var dataLoad = function (){
     $http.get('/maga/dataLoad').then(function(response) {
         $scope.site = response.data;             
         console.log("dataLoad - response.data:",response.data)              
     });
  }
  dataLoad();
})
