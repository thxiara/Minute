const slider = document.querySelector(".slider");
const comentarios = document.querySelectorAll(".comentario");

const arriba = document.querySelector(".izquierda");
const abajo = document.querySelector(".derecha");

let actual = 0;
const visibles = 2;

function mover(){

    const estilo = window.getComputedStyle(comentarios[0]);
    const margen = parseInt(estilo.marginBottom);

    const altura = comentarios[0].offsetHeight + margen + 20;

    slider.style.transform = `translateY(-${actual * altura}px)`;

}

abajo.addEventListener("click",()=>{

    if(actual < comentarios.length - visibles){

        actual++;

    }else{

        actual = 0;

    }

    mover();

});

arriba.addEventListener("click",()=>{

    if(actual > 0){

        actual--;

    }else{

        actual = comentarios.length - visibles;

    }

    mover();

});

setInterval(()=>{

    if(actual < comentarios.length - visibles){

        actual++;

    }else{

        actual = 0;

    }

    mover();

},5000);

window.addEventListener("load",mover);
window.addEventListener("resize",mover);