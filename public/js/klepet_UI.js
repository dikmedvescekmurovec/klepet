var trenutniVzdevek = "";
var trenutniKanal = "";
   
   
var vulgarneBesede = [];

$.get('/swearWords.csv', function(podatki){
  vulgarneBesede = podatki.split(',');  
});


function filtrirajVulgarneBesede(vhod) {
  for(var i in vulgarneBesede) {
    console.log(i);
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var dolzinaVulgarneBesede = vulgarneBesede[i].length;
      var zamenjava = "*";
      
      for(var j=0; j<dolzinaVulgarneBesede; j++) {
        zamenjava = zamenjava + "*";
      }
      
      return zamenjava;
    });
  }
  return vhod;
}

function divElementEnostavniTekst(sporocilo) {

  var jeSmesko = sporocilo.indexOf('http://sandbox.lavbic.net/teaching/OIS/gradivo/') > -1;
  if (jeSmesko) {
    sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
    return $('<div style="font-weight: bold"></div>').html(sporocilo);
  } else {
    return $('<div style="font-weight: bold;"></div>').text(sporocilo);
  }
}



function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;
  
  
  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtrirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }
  $('#poslji-sporocilo').val('');
  
  var re = new RegExp('https?://.+?\\.(jpg|png|gif)', 'gi')
  var link;
  while((link = re.exec(sporocilo)) != null){
     $('#sporocila').append("<img src=\"" + link[0] + "\" width=\"200\" style = \"margin-left: 20px\"></img>");
  }
  

  var reY = new RegExp('https?:\/\/www\.youtube\.com\/watch\\?v=([0-9a-z]+)', 'gi');
  var linkY;
  while((linkY = reY.exec(sporocilo)) != null){
    $('#sporocila').append("<iframe src=\"https://www.youtube.com/embed/" + linkY[1] + "\" allowfullscreen width=\"200\" height=\"150\" style=\"margin-left: 20px\"></iframe>");
  }

}
/** Lenna: https://upload.wikimedia.org/wikipedia/en/2/24/Lenna.png */

var socket = io.connect();

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
      trenutniVzdevek = rezultat.vzdevek;
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
    

    var obdelavaSporocila = sporocilo.besedilo;
    var re = new RegExp('https?://.+?\\.(jpg|png|gif)', 'gi')
    var link;
    while((link = re.exec(obdelavaSporocila)) != null){
      $('#sporocila').append("<img src=\"" + link[0] + "\" width=\"200\" style = \"margin-left: 20px\"></img>");
    }

    var reY = new RegExp('https?:\/\/www\.youtube\.com\/watch\\?v=([0-9a-z]+)', 'gi');
    var linkY;
    while((linkY = reY.exec(sporocilo.besedilo)) != null){
      $('#sporocila').append("<iframe src=\"https://www.youtube.com/embed/" + linkY[1] + "\" allowfullscreen width=\"200\" height=\"150\" style=\"margin-left: 20px\"></iframe>");
    }
    
  });

  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

  socket.on('uporabniki', function(uporabniki) {
    $('#seznam-uporabnikov').empty();
    for (var i=0; i < uporabniki.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(uporabniki[i]));
    }
    
    $('#seznam-uporabnikov div').click(function(){
      console.log("CLICKED");
      document.getElementById("poslji-sporocilo").value = "/zasebno \"" +$(this).text()+ "\"";
      document.getElementById("poslji-sporocilo").focus();
    });
  });

  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}
