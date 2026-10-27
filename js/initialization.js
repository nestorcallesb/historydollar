$(document).ready(function() {

	$("#dollar").DataTable( {
		"searching": false,
		"lengthChange": false,
		"paging": false,
		"pageLength" : 3,   // number of rows to display
		"order": [
 			[ 0, "asc" ],
 			[ 1, "desc" ],
 			[ 2, "desc" ]
 			],
		"columns": [
			{ data: "moneda", title: "Moneda" },
			{ data: "fuente", title: "Fuente" },
			{ data: "promedio", title: "Tasa" },
			{ data: "fechaActualizacion", title: "Fecha Actualización" }
 			]
	});
	$("#history").DataTable( {
		"pageLength" : 10,   // number of rows to display
		"order": [
 			[ 3, "desc" ],
 			[ 0, "desc" ],
  			],
		"columns": [
			{ data: "moneda", title: "Moneda", defaultContent: "-"  },
			{ data: "fuente", title: "Fuente" },
			{ data: "promedio", title: "Tasa Promedio" },
			{ data: "fecha", title: "Fecha" }
 			]
	});
	
///////////////////////////////////////////////////////////////////////////////////////////////////
	
	/// Calculo dolares/oficial
	const dolar = leerDollar(window.urls.urlbcv);
	dolar.then((resultado) => {
		if (resultado && resultado.fechaActualizacion) {
			resultado.fechaActualizacion = formatearFechaVenezuela(resultado.fechaActualizacion);
		}
	// 2. Agregas la fila y dibujas la tabla una vez que tienes los datos
		$("#dollar").DataTable().row.add(resultado).draw();
	}).catch((error) => {
	// Escuchas si la promesa falla
	console.error("❌ Hubo un error al obtener los datos:", error);
	})	
///////////////////////////////////////////////////////////////////////////////////////////////////
	/// Calculo dolares/paralelo
	const paralelo = leerDollar(window.urls.urlusdt);
	paralelo.then((resultado) => {
		if (resultado && resultado.fechaActualizacion) {
			resultado.fechaActualizacion = formatearFechaVenezuela(resultado.fechaActualizacion);
		}
		resultado.promedio = (resultado.promedio).toFixed(4);
	// 🚀 2. SUSTITUCIÓN: Interceptamos las palabras y las cambiamos por "USDT"		
		if (resultado.fuente == "paralelo") {
		resultado.fuente = "USDT";
	        }
		if (resultado.nombre == "Paralelo") {
			resultado.nombre = "Dólar USDT";
		}
	// 3. Agregas la fila y dibujas la tabla una vez que tienes los datos
		$("#dollar").DataTable().row.add(resultado).draw();
	}).catch((error) => {
	// Escuchas si la promesa falla
		console.error("❌ Hubo un error al obtener los datos:"+paraleloURL, error);
	})
///////////////////////////////////////////////////////////////////////////////////////////////////
	/// Calculo euros/oficial
	const euro = leerDollar(window.urls.urleuro);
	euro.then((resultado) => {
		if (resultado && resultado.fechaActualizacion) {
			resultado.fechaActualizacion = formatearFechaVenezuela(resultado.fechaActualizacion);
		}
		resultado.promedio = (resultado.promedio).toFixed(4);
	// 2. Agregas la fila y dibujas la tabla una vez que tienes los datos
	$("#dollar").DataTable().row.add(resultado).draw();
	}).catch((error) => {
	// Escuchas si la promesa falla
		console.error("❌ Hubo un error al obtener los datos:", error);
	})
///////////////////////////////////////////////////////////////////////////////////////////////////
	// Definimos las dos URLs de los históricos
	// 🚀 UNIFICACIÓN ASÍNCRONA: Esperamos por ambas respuestas de internet
	Promise.all([
		leerDollar(window.urls.urlhdolar),
		leerDollar(window.urls.urlheuro)
	]).then(([dataDolar, dataEuro]) => {
	// Creamos un único arreglo vacío donde acumularemos todo
		let historicoUnificado = [];
	// 1. PROCESAMOS LOS DATOS DE DÓLARES
		if (dataDolar && Array.isArray(dataDolar)) {
			dataDolar.forEach((registro) => {
	// Sustituimos "paralelo" por "USDT" como querías
				if (registro.fuente === "paralelo") {
					registro.fuente = "USDT";
				} else if (registro.fuente === "oficial") {
					registro.fuente = "BCV";
				}
	// 🛠️ IMPORTANTE: Le inyectamos la propiedad moneda que le falta al JSON de la API
				registro.moneda = "USD"; 
	// Formateamos su promedio a 2 decimales para la tabla
				if (registro.promedio) {
					registro.promedio = parseFloat(registro.promedio).toFixed(3).replace('.', ',');
				}
			historicoUnificado.push(registro);
			});
		}

	// 2. PROCESAMOS LOS DATOS DE EUROS
		if (dataEuro && Array.isArray(dataEuro)) {
			dataEuro.forEach((registro) => {
	// Sustituimos "paralelo" por "USDT" como querías
				if (registro.fuente === "paralelo") {
					registro.fuente = "EUR";
				} else if (registro.fuente === "oficial") {
					registro.fuente = "BCV";
				}
		    
	// El Euro ya trae su propiedad registro.moneda = "EUR" desde la API
				if (registro.promedio) {
					registro.promedio = parseFloat(registro.promedio).toFixed(3).replace('.', ',');
				}

				historicoUnificado.push(registro);
			});
		}

	// 3. RENDERIZADO ÚNICO EN DATATABLES
	// Limpiamos la tabla por completo para evitar que se dupliquen datos al recargar
		$("#history").DataTable().clear();

	// Cargamos la lista combinada (Dólares + Euros) y redibujamos una sola vez (.draw)
		$("#history").DataTable().rows.add(historicoUnificado).draw();
    
		console.log("📊 Historial unificado cargado con éxito en DataTables.");

	}).catch((error) => {
    console.error("❌ Hubo un error crítico al obtener los históricos unificados:", error);
});

//////////////////////////// FASE #2 CALCULADORA DE DOLARES ///////////////////////////////////////
	// 1. Obtiene el Dólar Oficial de HOY de forma automática
	Promise.all([
		obtenerCotizacionHabil(
			{ moneda: 'dolares', fuente: 'oficial' }),
		obtenerCotizacionHabil(
			{ moneda: 'dolares', fuente: 'paralelo' }),
		obtenerCotizacionHabil(
			{ moneda: 'euros', fuente: 'oficial' })
	]).then(([resBcv, resusdt, resEuro]) => {

	// 2. Guardamos la tasa BCV si respondió con éxito
		if (resBcv) {
			window.tasasCargadas.bcv.promedio = parseFloat(resBcv.promedio).toFixed(4);
			window.tasasCargadas.bcv.fecha = (resBcv.fecha);
		}

        // 3. Guardamos la tasa Paralelo si respondió con éxito
		if (resusdt) {
			window.tasasCargadas.usdt.promedio = parseFloat(resusdt.promedio).toFixed(4);
			window.tasasCargadas.usdt.fecha = (resusdt.fecha);
		}

	// 4. Guardamos la tasa Euro si respondió con éxito
		if (resEuro) {
			window.tasasCargadas.euro.promedio = parseFloat(resEuro.promedio).toFixed(4);
			window.tasasCargadas.euro.fecha = (resEuro.fecha);
		}

		console.log("✅ ¡Todas las tasas se han cargado en memoria con éxito!", window.tasasCargadas);
	// 🚀 AHORA SÍ: Como las tasas no están en cero, el cálculo dará el porcentaje real
		window.arrayDiferencias = calcularDiferenciasPorcentuales();
		
		$("#txtBCVUSDT").text(window.arrayDiferencias[0].descripcion);
		$("#txtBCVEURO").text(window.arrayDiferencias[1].descripcion);
		$("#txtUSDTBCV").text(window.arrayDiferencias[2].descripcion);
		$("#txtUSDTEURO").text(window.arrayDiferencias[3].descripcion);
		$("#txtEUROBCV").text(window.arrayDiferencias[4].descripcion);
		$("#txtEUROUSDT").text(window.arrayDiferencias[5].descripcion);

		$("#resBCVUSDT").text(window.arrayDiferencias[0].texto);
		$("#resBCVEURO").text(window.arrayDiferencias[1].texto);
		$("#resUSDTBCV").text(window.arrayDiferencias[2].texto);
		$("#resUSDTEURO").text(window.arrayDiferencias[3].texto);
		$("#resEUROUSDT").text(window.arrayDiferencias[5].texto);
		$("#resEUROBCV").text(window.arrayDiferencias[4].texto);

		$("#tasaBCV").text(window.tasasCargadas.bcv.promedio+" Bs/USD");	
		$("#tasaUSDT").text(window.tasasCargadas.usdt.promedio+" Bs/USDT");
		$("#tasaEURO").text(window.tasasCargadas.euro.promedio+" Bs/EURO");

		$("#fechaBCV").text(window.arrayDiferencias[0].fecha);	
		$("#fechaUSDT").text(window.arrayDiferencias[3].fecha);	
		$("#fechaEURO").text(window.arrayDiferencias[5].fecha);	
		
		$("#montobcv").prop("readOnly", false);
		$("#montousdt").prop("readOnly", false);
		$("#montoeuro").prop("readOnly", false);
		$("#bolivares").prop("readOnly", false);
        // Actualizamos los montos de la calculadora de bolívares en pantalla
		
		if (typeof calcularConversiones === "function") {
			calcularConversiones();resetCampoTasas();
		}

	}).catch(error => {
		console.error("❌ Ocurrió un error al procesar las promesas unificadas:", error);
	});

		$('.btn-toggle-spans').on('click', function() {
	    // Alterna entre colapsar y expandir la estructura
			$('.collapse').collapse('toggle');
		});

		$('.btn-copiar-calculadora').on('click', function() {
		var $boton = $(this);
		var inputId = $boton.data('target'); // Obtiene el ID asignado (bolivares, montobcv, etc.)
		var valorTexto = $('#' + inputId).val(); // Lee el valor real del input en ese instante

		// Si el campo está vacío o en cero, evitamos copiar basura
		if (!valorTexto || valorTexto == "0.00" || valorTexto == "0") return;

		// Intentar usar la API moderna del portapapeles
		if (navigator.clipboard && window.isSecureContext) {
			navigator.clipboard.writeText(valorTexto).then(function() {
				notificarCopiaExitosa($boton);
			}).catch(function(err) {
				console.error("Error al copiar: ", err);
			});
		} else {
			// Alternativa compatible para entornos HTTP locales o navegadores antiguos
			var $tempInput = $("<input>");
			$("body").append($tempInput);
			$tempInput.val(valorTexto).select();
			try {
				document.execCommand("copy");
				notificarCopiaExitosa($boton);
			} catch (err) {
				alert("No se pudo copiar automáticamente en este navegador.");
			}
			$tempInput.remove(); // Elimina el input temporal
		}
	});

	// Función interna para dar feedback visual al usuario en celulares
	function notificarCopiaExitosa($btn) {
		var textoPrevio = $btn.text();
		// Cambia el botón a verde y avisa que fue copiado
		$btn.text('¡Listo!').removeClass('btn-primary').addClass('btn-success');
		
		// Regresa a su estado original después de 1.2 segundos
		setTimeout(function() {
			$btn.text(textoPrevio).removeClass('btn-success').addClass('btn-primary');
		}, 1500);
	}
});