let products = [];
let productsBKP = []; // será utilizado para fazer o filtro por nome e, guardará o array completo
let count= 0; // usado para o tabindex do component
let types = []; // array para aramazenar os tipos, afim de popular o select de tipos para o filtro
let brands = []; // array para aramazenar as marcas, afim de popular o select de marcas para o filtro
const dollar = 5.5;

const url = "http://makeup-api.herokuapp.com/api/v1/products.json";

const catalog = document.getElementById("catalog");
const sort = document.getElementById('sort-type');
const filterName = document.getElementById('filter-name');
const filterBrand = document.getElementById('filter-brand');
const filterType = document.getElementById('filter-type');


// função para realizar o fetch nas APIs
function fetchJson(url, options){
  return fetch(url, options).then((r)=>{
      if(r.ok){
          return r.json();
      }else{
          throw new Error(r.statusText);
      }
  }).catch(error => {
      showError("Error Loadin Data", error);
      throw error;
  });
}

// função à ser utilizada na inicialização (INIT), onde não há alteraçã da URL
// a url será alterada nas funções de filtros de band e type 
// serão acrescidos à url os parametros de busca na API (?brand=covergirl&product_type=lipstick)
function listAllProducts(u){
    return fetchJson(u);
}

async function init(){
  [products] = await Promise.all([listAllProducts(url)]); // converte a Promise em Array
  orderListByRating(products); // ordena a lista por Pontuação (rating)
  sort.addEventListener('change', classify); // listener para classifiação
  filterName.addEventListener('change', filterByname); // listener para filtro por nome
  filterBrand.addEventListener('change', searchBrandType); // listener para filtro por marca
  filterType.addEventListener('change', searchBrandType); // listener para filtro por tipo

  renderData();  // função renderiza os dados e envia para os components e monta o HTML
  renderFilterBrandType(); // fução popula os selects da marca e do tipo, a serem utilizado nos filtros
  
}
init(); // chama a função de inicialização


// CLASSIFY 
function classify(){
  if (sort.value=='Melhor Avaliados'){
    orderListByRating();
    renderData()
  }
  if (sort.value=='Maiores Preços'){
    orderListByPriceZA();
    renderData()
  }
  if (sort.value=='Menores Preços'){
    orderListByPriceAZ();
    renderData()
  }
  if (sort.value=='A-Z'){
    orderListByNameAZ();
    renderData()
  }
  if (sort.value=='Z-A'){
    orderListByNameZA();
    renderData()
  }
}

function orderListByRating(){
  products.sort((a, b) => b.rating - a.rating  ); // ordena pelo rating do maior para o menor
}
function orderListByPriceZA(){
  products.sort((a, b) => b.price - a.price  ); // ordena pelo preco do maior para o menor
}
function orderListByPriceAZ(){
  products.sort((a, b) => a.price - b.price  ); // ordena pelo preco do menor para o maior
}
function orderListByNameAZ(){   // ordena por nome do menor para o maior (AZ)
  products.sort((a, b) => {
    if(b.name > a.name){
        return -1;
    }
  });
}
function orderListByNameZA(){   // ordena por nome do maior para o menor (ZA)
  products.sort((a, b) => {
    if(a.name > b.name){
        return -1;
    }
  });
}

// End CLASSIFY

// FILTER
async function searchBrandType(){
  const brand = filterBrand.value;
  const type = filterType.value;
  filterName.value = "";
  let url_complement;
 
  if (!brand && type){
    url_complement = `?product_type=${type}`;
  }
  if (brand && !type){
    url_complement = `?brand=${brand}`;
  }
  if (brand && type ){
    url_complement = `?brand=${brand}&product_type=${type}`;
  }
  if (!brand && !type ){
    url_complement = ``;
  }
  // uso de função assincrona para nova solicitação REST à API
  // filtro por brand e/ou type
  [products] = await Promise.all([listAllProducts(url + url_complement)]);
  renderData();
}

//filtro por nome
function filterByname(){
  let nameSearch = filterName.value
  if (nameSearch){
    // necessário restaurar o array de produtos para que a consulta seja realizada levando
    // consideração
    if (productsBKP.length > 0 ){
      products =  productsBKP 
    }
    // productsFiltered = products.filter(busca) ;
    productsFiltered = products.filter(item => item.name == nameSearch) ;
    productsBKP = products;
    products = productsFiltered;
    renderData();
  }else{
    products =  productsBKP;
    renderData();
  }
  console.log(productsFiltered)
}
//usado para entender o funcionamento do FILTER
function busca(item){
  let nameSearch = filterName.value; 
  return item.name == nameSearch;
}
// End FILTER

function renderData(){
  catalog.innerHTML = "";
  count = 0;
  for(const product of products){
    count++;
    
    p = validateProduct(product);
    getBrandType(p);

    // adiciona uma propriedade ao objeto product a ser utilizado nos components
    Object.defineProperty(p, 'tabindex',{
      value: count,
      writable: true,
      enumerable: true,
      configurable: true
    });
    const divProduct = document.createElement('div')
    divProduct.innerHTML= productItem(p);
    catalog.appendChild(divProduct);
  }
  console.log(count);
}

function renderFilterBrandType(){
  for(brand of brands){
    op = document.createElement("option");
    op.text=brand;
    filterBrand.add(op);
  }
  for(type of types){
    op = document.createElement("option");
    op.text=type;
    filterType.add(op);
  }
}

function getBrandType(product){
  if (!brands.find((element) => element == product.brand) && product.brand ){
    brands.push(product.brand);
  } 
  if (!types.find((element) => element == product.product_type) && product.product_type ){
    types.push(product.product_type);
  } 
}

// VALIDATIONS
function is_img(imgUrl) {
  //em testes
  var imagemRequest = new XMLHttpRequest();
  imagemRequest .open('HEAD', imgUrl, false);
  imagemRequest .send(); //Uncaught DOMException: Failed to execute 'send' on 'XMLHttpRequest': Failed to load 'https://www.purpicks.com/wp-content/uploads/2018/06/Zorah-Biocosmetiques-Liquid-Liner.png'.

  var resultado = imagemRequest.status;

  if (resultado == 404){
    return false;
  }else{
    return true;
  }
  // testar outros códigos, como 500 e 503 por exemplo..
}

function validateProduct(product){
  // *OK* trocar valor do price com duas casas decimais
  // *OK*quando null, Para informação numérica (rating, price, ...) considerar o valor 0 como default 
  // *OK*para informações textuais (brand, product_type,..) considerar o valor “” como default
  //validar caminho da imagem
  if(product.price_sign!="R$"){
    if (!product.price){
      product.price= 0;
    }else{
      product.price = (product.price * dollar).toFixed(2);
    }
    if (!product.rating) product.rating= 0;  
    if (!product.brand){
      product.brand= "";
    }else{
      product.brand = product.brand.trim().replace("\n","");
    } 
    if (!product.category){
      product.category= "";
    }else{
      product.category = product.category.trim().replace("\n","");
    } 
    if (!product.name){
      product.name= "";
    }else{
      product.name = product.name.trim().replace("\n", "");
    }
      
    if (!product.product_type) product.product_type= "";
    product.price_sign = "R$";
    // apresenta erro na função is_img (SEND)
    // if(!is_img(product.image_link)){
    //   product.image_link = "img/unavailable.png";
    // }
    
  }
  return product;
}

// End VALIDATIONS

// ERRORS
function showError(message, error){
  document.getElementById("errors").textContent = message;
  if (error){
      console.error(error);
  }
}
// End ERRORS