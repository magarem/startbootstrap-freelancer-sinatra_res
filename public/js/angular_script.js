var mod = angular.module("myapp", ['ngSanitize', 'ng-sortable','ngAnimate', 'ui.bootstrap', 'ngFileUpload']);



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



mod.directive('contenteditable', ['$timeout', function($timeout) { return {
    restrict: 'A',
    require: '?ngModel',
    link: function(scope, element, attrs, ngModel) {
      // don't do anything unless this is actually bound to a model
      if (!ngModel) {
        return
      }

      // options
      var opts = {}
      angular.forEach([
        'stripBr',
        'noLineBreaks',
        'selectNonEditable',
        'moveCaretToEndOnChange',
      ], function(opt) {
        var o = attrs[opt]
        opts[opt] = o && o !== 'false'
      })

      // view -> model
      element.bind('input', function(e) {
        scope.$apply(function() {
          var html, html2, rerender
          html = element.html()
          rerender = false
          if (opts.stripBr) {
            html = html.replace(/<br>$/, '')
          }
          if (opts.noLineBreaks) {
            html2 = html.replace(/<div>/g, '').replace(/<br>/g, '').replace(/<\/div>/g, '')
            if (html2 !== html) {
              rerender = true
              html = html2
            }
          }
          ngModel.$setViewValue(html)
          if (rerender) {
            ngModel.$render()
          }
          if (html === '') {
            // the cursor disappears if the contents is empty
            // so we need to refocus
            $timeout(function(){
              element[0].blur()
              element[0].focus()
            })
          }
        })
      })

      // model -> view
      var oldRender = ngModel.$render
      ngModel.$render = function() {
        var el, el2, range, sel
        if (!!oldRender) {
          oldRender()
        }
        element.html(ngModel.$viewValue || '')
        if (opts.moveCaretToEndOnChange) {
          el = element[0]
          range = document.createRange()
          sel = window.getSelection()
          if (el.childNodes.length > 0) {
            el2 = el.childNodes[el.childNodes.length - 1]
            range.setStartAfter(el2)
          } else {
            range.setStartAfter(el)
          }
          range.collapse(true)
          sel.removeAllRanges()
          sel.addRange(range)
        }
      }
      if (opts.selectNonEditable) {
        element.bind('click', function(e) {
          var range, sel, target
          target = e.toElement
          if (target !== this && angular.element(target).attr('contenteditable') === 'false') {
            range = document.createRange()
            sel = window.getSelection()
            range.setStartBefore(target)
            range.setEndAfter(target)
            sel.removeAllRanges()
            sel.addRange(range)
          }
        })
      }
    }
  }}])

mod.factory('SiteData', ['$http', '$location', function($http, $location){

    var url = document.URL;
    var urlArray = url.split("/");
    var siteNome = urlArray[urlArray.length-1];

    console.log("url:", siteNome);
    
    var _getSiteData = function(){
      return $http.get('/'+siteNome+'/dataLoad');
    }

    var _savePortfolioOrder = function(data){
      return $http.post('/'+siteNome+'/portfolio/ordena', data);
    }

    var _saveDiv = function(obj, val, item_n){    
      console.log(obj, val, item_n);
      return $http.post("/"+siteNome+"/obj_save", {obj: obj, val: val, item_n: item_n});
    }

    var _portAdd = function(){    
      // console.log(obj);
      return $http.post("/portfolio/add", {siteNome: siteNome});
    }

    return {
      getSiteData: _getSiteData,
      savePortfolioOrder: _savePortfolioOrder,
      saveDiv: _saveDiv,
      portAdd: _portAdd
    }
    // return{
    //   name: 'Site Service',
    //   get: function(callback){
    //     $http.get('/maga/dataLoad').then(function(response) {
    //       callback(response.data);             
    //       //console.log("dataLoad - response.data:",response.data)              
    //     });
    //   }
    // };
  }]);

mod.controller('topCtrl', function ($scope, $http, SiteData) {
  
  $scope.site = {}; 
   SiteData.getSiteData().then(function(response) {
    $scope.site = response.data;
    console.log("SiteData[top]:", response.data);
  })

  $scope.saveDiv = function(obj){   
    console.log(obj); 
    SiteData.saveDiv(obj, $scope.$eval(obj)).then(function(response) {
       // console.log(response.data);
    })    
  }
})

mod.controller('navCtrl',['$scope', 'SiteData', function ($scope, SiteData) {
  $scope.site = {};   
  SiteData.getSiteData().then(function(response) {
    $scope.site = response.data;
    console.log("SiteData[1]:", response.data);
  })
  $scope.saveDiv = function(obj){    
    SiteData.saveDiv(obj, $scope.$eval(obj)).then(function(response) {
       // console.log(response.data);
    })    
  }
}])

mod.controller('headerCtrl',['$scope', 'SiteData', function ($scope, SiteData) {
  $scope.site = {}; 
  SiteData.getSiteData().then(function(response) {
    $scope.site = response.data;
  })
  
  $scope.saveDiv = function(obj){    
    SiteData.saveDiv(obj, $scope.$eval(obj)).then(function(response) {
       // console.log(response.data);
    })    
  }
}])

mod.controller('imgGridCtrl',['$scope', '$rootScope', '$uibModal', '$log', 'SiteData', function ($scope, $rootScope, $uibModal, $log, SiteData) {
  $scope.imgs = [];
  $scope.imageCategories = [];

  // SiteData.getSiteData().then(function(response) {
  //   $scope.site = response.data;
  //   console.log("SiteData[imgGridCtrl]:", response.data);
  // })

  SiteData.getSiteData().then(function(response) {
    $scope.site = response.data;
    $scope.imgs = response.data.pages.portfolio.items;
    console.log("SiteData[imgGridCtrl]:", $scope.imgs);
    categoriasUpdate();
  })
  
  $scope.saveDiv = function(obj){    
      SiteData.saveDiv(obj, $scope.$eval(obj)).then(function(response) {
         
      })    
  }

  $scope.barConfig = {
    onSort: function (evt){
      console.log("barconfig [evt]:",evt.models)
      // $http.post('/{{data}}/portfolio/ordena/'+evt.models); 
      SiteData.savePortfolioOrder(evt.models).success(function () {})

      // $http({
      //   headers : {
      //     "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8;"
      //   },
      //   method: 'POST',
      //   url: "/maga/portfolio/ordena",                  
      //   data: evt.models
      // }).success(function () {})
      //   $http.post('/{{data}}/portfolio/ordena', $httpParamSerializer(evt)).
      // success(function(data){/* response status 200-299 */}).
      // error(function(data){/* response status 400-999 */});
    }
  };

  $rootScope.$on("CallDelImg", function(event, item_index){
    delImg(item_index);
  });

  $rootScope.$on("ImgChange", function(event, src, index, siteNome){  
    // console.log("ImgChange - src:",src,", index:",index)
    // $scope.imgs[index].img = src
    // console.log("$scope.imgs[index].img:", $scope.imgs[index].img)
    ImgChange(src, index, siteNome)
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
    console.log("$scope.imgs:",$scope.imgs)          
  }
    
  var ImgChange = function (src, index, conta){
    console.log("ImgChange - src:",src,", index:",index)
    // $scope.imgs[index].img = src
    console.log("$scope.imgs[index].img:", $scope.imgs[index].img)
    src = "/contas/"+conta+"/img/portfolio/"+src
    $scope.imgs[index].img = src
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

  $scope.portfolio_add = function () {
    console.log("+")
    img_new =  {  "id"     : 0,
                  "titulo" : "Novo",
                  "img"    : "/img/noimage.png",
                  "txt"    : "Txt novo",
                  "nome"   : "",
                  "site"   : "",
                  "data"   : "",
                  "servico": "",
                  "cat"    : ""
                }
    //Salva no disco o novo registro
    SiteData.portAdd().then(function(response) {
       
    })    
    $scope.imgs.push(img_new)
    //Service.images.push(img_new)
    //$scope.open(img_new, id_last)
    // console.log(img_new)
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
}]);


mod.controller('ModalInstanceCtrl', function ($scope, $rootScope, $uibModalInstance, $timeout, SiteData, item, i) {
  $scope.item = item;
  $scope.a = 10;
  $scope.i = i;
  console.log("item.titulo>", item)

  $rootScope.$on("ModalClose", function(){  
      $scope.cancel();
  });

  $scope.cancel = function () {
    $uibModalInstance.dismiss('cancel');
  };   

  $scope.saveDiv = function(obj, i){    
    SiteData.saveDiv(obj, $scope.$eval(obj), i).then(function(response) {
       // console.log(response.data);
    })    
  }    
});


mod.controller('MyFormCtrl', ['$scope', '$rootScope', 'Upload', '$timeout', '$http', 'SiteData', function ($scope, $rootScope, Upload, $timeout, $http, SiteData) {
  
   $scope.uploadFile = function(index){

        console.log("???file:",file,"index:",index)
        var url = document.URL;
        var urlArray = url.split("/");
        var siteNome = urlArray[urlArray.length-1];

        var file = $scope.myFile;
        console.log('file is ' );
        console.dir(file);
        var uploadUrl = '/'+siteNome+'/portfolio/save/'+index;
        fileUpload.uploadFileToUrl(file, uploadUrl)
          .then(function () {
              console.log('success');
          }, function () {
               
          }, function () {
              console.log('progress');
          });
    }
    


  $scope.up = function(){
     angular.element('#file').trigger('click');
  };

  $scope.excluir = function(item_index){
    var url = document.URL;
    var urlArray = url.split("/");
    var siteNome = urlArray[urlArray.length-1];
    
    console.log("Excluir:",item_index);      
    //Service.ex(item); 
    $http.post('/'+siteNome+'/portfolio/delete/'+item_index); 
    $rootScope.$emit("CallDelImg", item_index);             
    $rootScope.$emit("ModalClose", item_index);
  };   

  $scope.saveDiv = function(obj, i){        
    SiteData.saveDiv(obj, $scope.$eval(obj), i).then(function(response) { 

    })   
    $rootScope.$emit("categoriasUpdate"); 
  } 
  
  $scope.uploadPic = function(file, index) {
    a = 0
    console.log("--file:",file,"index:",index)

    var url = document.URL;
    var urlArray = url.split("/");
    var siteNome = urlArray[urlArray.length-1];
    if (file == undefined) {
      // Upload.upload({
      //   url: '/maga/portfolio/save/'+index,
      //   data: {item: $scope.item},      
      // }); 
      ok = true       
    }else{
      if (file.size < 600000) {
        console.log('upload')

        file.upload = Upload.upload({
            url: '/'+siteNome+'/portfolio/save/'+index,
            data: {item: $scope.item, file: file},
       }).then(function (resp) {
            console.log('---Success ' + resp.config.data.file.name + 'uploaded. Response: ' + resp.data);
            $rootScope.$emit("ImgChange",file.name, index, siteNome);
        }, function (resp) {
            console.log('---Error status: ' + resp.status);
        }, function (evt) {
            var progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
            console.log('---progress: ' + progressPercentage + '% ' + evt.config.data.file.name);
            $rootScope.$emit("ImgChange",file.name, index, siteNome);
        });
        
        


        // file.upload.then(function () {

        //   }, function () {
        //       console.log('error');
        //   }, function () {
        //       console.log('progress');
        //       console.log('success');    
        //       // $rootScope.$emit("ImgChange",file.name, index, siteNome); 

        //   }
        // );
        // $timeout(callAtTimeout, 5000);
        // function callAtTimeout() {
        //       $rootScope.$emit("ImgChange",file.name, index, siteNome); 
        // }
        
        // Upload.upload({
        //   url: '/'+siteNome+'/portfolio/save/'+index,
        //   data: {item: $scope.item, file: file},      
        // }).then(function (resp) {
        //   $scope.item.img = "img/portfolio/"+file.name;
        //   console.log('$scope.item.img:',$scope.item.img)
        //   console.log('resp:', resp)
        // })       
        //Service.images[$scope.item.id].img = "img/portfolio/"+file.name;    
        // console.log("response.data:", a)
        // if (a) {
        //   alert();
        //   $rootScope.$emit("ImgChange",file.name, index, siteNome); 
        // }
        // ok = true
      }else{
        alert("Imagem muito grande.");
        ok = 0
      }
      
    }  
    $rootScope.$emit("categoriasUpdate");
    // if (ok) {
      
    //   $rootScope.$emit("categoriasUpdate"); 
    //   alert("Documento salvo com sucesso!");
    // }
    // if (!file == undefined) {
    //     file.upload.then(function (response) {
    //       $timeout(function () {file.result = response.data; });
    //     }, function (response) {
    //       if (response.status > 0)
    //         $scope.errorMsg = response.status + ': ' + response.data;
    //     }, function (evt) {
    //       // Math.min is to fix IE which reports 200% sometimes
    //       file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
    //     });
    // }
  }
}]);


mod.controller('aboutCtrl', function ($scope, $http, SiteData) {
  
  $scope.about = {}; 
  SiteData.getSiteData().then(function(response) {
    str = response.data.pages.about    
    $scope.about = str
    $scope.about_body1 = str.body1
    console.log("SiteData[aboutCtrl]:", str);
  })
  $scope.saveDiv = function(obj){    
    SiteData.saveDiv(obj, $scope.$eval(obj)).then(function(response) {
       // console.log(response.data);
    })    
  }

})

mod.controller('ContactCtrl', function ($scope, $http, SiteData) {
  $scope.contact = {}; 
  SiteData.getSiteData().then(function(response) {    
    $scope.contact = response.data.pages.contact
  })
  $scope.saveDiv = function(obj){    
    SiteData.saveDiv(obj, $scope.$eval(obj)).then(function(response) {
       // console.log(response.data);
    })    
  }

})

mod.controller('footerCtrl', function ($scope, $http, SiteData) {
  
  $scope.site = {}; 
   SiteData.getSiteData().then(function(response) {
    $scope.site = response.data;
    console.log("SiteData[footerCtrl]:", response.data);
  })

  $scope.saveDiv = function(obj){   
    console.log(obj); 
    SiteData.saveDiv(obj, $scope.$eval(obj)).then(function(response) {
       // console.log(response.data);
    })    
  }
})

mod.controller('loginCtrl', function ($scope, $http, SiteData) {
  
  $scope.site = {}; 
   SiteData.getSiteData().then(function(response) {
    $scope.site = response.data;
    console.log("SiteData[top]:", response.data);
  })

  $scope.saveDiv = function(obj){   
    console.log(obj); 
    SiteData.saveDiv(obj, $scope.$eval(obj)).then(function(response) {
       // console.log(response.data);
    })    
  }
})
