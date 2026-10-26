	async function leerDollar(url) {
		try {
	// 1. Hacemos la petición
			const respuesta = await fetch(url);
	// 2. Verificamos que la petición sea exitosa
			if (!respuesta.ok) {
				throw new Error(`❌ Error en la petición: ${respuesta.status}`);
			}
	// 3. Leemos y procesamos la información (ej. JSON)
			const res = await respuesta.json();
			return res; 
		} catch (error) {
		console.error('❌ Hubo un problema con la petición:', error);
		}
}

	async function obtenerCotizacionHabil({
		moneda = 'dolares', 
		fuente = 'oficial', 
		// Si no se pasan anio, mes o dia, se calcula automáticamente la fecha de hoy
		anio = new Date().getFullYear(),
		mes = new Date().getMonth() + 1,
		dia = new Date().getDate()
		} = {}) { // '= {}' permite invocar la función vacía sin que rompa el código
	 
	 	const MAX_DIAS_ADELANTE = 3; 
	 	const MAX_DIAS_ATRAS = 5;    

	// 1. FASE FUTURO: Intentar la fecha base y evaluar días siguientes
		let fechaBusqueda = new Date(anio, mes - 1, dia);
	 
		for (let i = 0; i <= MAX_DIAS_ADELANTE; i++) {
			const a = fechaBusqueda.getFullYear();
			const m = String(fechaBusqueda.getMonth() + 1).padStart(2, '0');
			const d = String(fechaBusqueda.getDate()).padStart(2, '0');
			const url = `https://ve.dolarapi.com/v1/historicos/${moneda}/${fuente}/${a}/${m}/${d}`;
			console.log(`🔍 URL a consultar ${url}`);
			try {
				console.log(`🔍 [FUTURO] Buscando ${moneda} (${fuente}) el ${d}/${m}/${a}...`);
				const respuesta = await fetch(url);

				if (respuesta.ok) {
					const datos = await respuesta.json();
					return {
					fase: "Siguiente Día Hábil / Actual",
					fecha: `${d}/${m}/${a}`,
					promedio: datos.promedio
					};
				}
	// Si la fecha ingresada no tiene registro en la base de datos
				if (respuesta.status === 404) {
				fechaBusqueda.setDate(fechaBusqueda.getDate() + 1);
				} else {
				throw new Error(`Error en servidor: ${respuesta.status}`);
				}
			} catch (error) {
				console.error(`❌ Error de red: ${error.message}`);
				break; 
			}
		}

	// 2. FASE PASADO: Si el futuro falla, retrocedemos para buscar el último histórico
		console.log(`⚠️ No hay datos futuros para ${moneda} (${fuente}). Buscando hacia el pasado...`);
	 
		fechaBusqueda = new Date(anio, mes - 1, dia);
		fechaBusqueda.setDate(fechaBusqueda.getDate() - 1); 

		for (let i = 0; i < MAX_DIAS_ATRAS; i++) {
			const a = fechaBusqueda.getFullYear();
			const m = String(fechaBusqueda.getMonth() + 1).padStart(2, '0');
			const d = String(fechaBusqueda.getDate()).padStart(2, '0');

			const url = `https://dolarapi.com{moneda}/${fuente}/${a}/${m}/${d}`;

			try {
				console.log(`🔍 [PASADO] Buscando ${moneda} (${fuente}) el ${d}/${m}/${a}...`);
				const respuesta = await fetch(url);

				if (respuesta.ok) {
					const datos = await respuesta.json();
					return {
						fase: "Último Histórico Disponible",
						fecha: `${d}/${m}/${a}`,
						promedio: datos.promedio
					};
				}

				if (respuesta.status === 404) {
					fechaBusqueda.setDate(fechaBusqueda.getDate() - 1);
				}
			} catch (error) {
				console.error(`❌ Error de red: ${error.message}`);
				return null;
			}
		}

		console.warn(`🚨 No se encontraron tasas válidas en ninguna dirección.`);
		return null;
	}
//////////////////////////////////////////////////////////////////////////////////////////////////////
	function formatearFechaVenezuela(fechaInput) {
		if (!fechaInput) return "Fecha no disponible";

		try {
			const fechaObj = new Date(fechaInput);
	// Validamos que el objeto Date sea válido
			if (isNaN(fechaObj.getTime())) {
				return "Fecha inválida";
			}

			return new Intl.DateTimeFormat("es-VE", {
				timeZone: "America/Caracas",
				year: "numeric",
				month: "2-digit",
				day: "2-digit",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
				hour12: false // ✅ TRUE se activa el formato de 12 horas con AM/PM pero quiero el formato 24 horas
			}).format(fechaObj);
		} catch (error) {
			console.error("❌ Error al formatear la fecha:", error);
		return String(fechaInput);
		}
	}

/**
 * Filtra una cadena de texto para permitir únicamente números con hasta dos decimales.
 * Convierte automáticamente las comas en puntos.
 * @param {string} valor input - El valor actual del campo de texto
 * @return {string} El valor procesado y limpio
 */
	window.limpiarFormatoDecimal = function(valor) {
		if (!valor) return '';

	 //1. Reemplazamos cualquier coma por un punto para estandarizar los decimales
		valor = valor.replace(/,/g, '.');

	//2. Permitimos solo números y un único punto decimal
		valor = valor.replace(/[^0-9.]/g, '');
		
	//3. Evitamos que se escriba más de un punto decimal
		let puntos = valor.split('.');
		if (puntos.length > 2) {
			valor = puntos[0] + '.' + puntos.slice(1).join('');
		}

	//4. Expresión regular para limitar estrictamente a un máximo de 2 decimales
		let regexDecimal = /^\d*(\.\d{0,2})?/;
		let resultado = valor.match(regexDecimal);

	//5. Devolvemos el valor corregido
		return resultado ? resultado[0] : '';
	};

/**
 * Calcula el porcentaje de diferencia entre las tasas cargadas en memoria.
 * @return {Array|null} Array con los JSON de diferencias porcentuales o null si faltan datos.
 */
	function calcularDiferenciasPorcentuales() {
	// 1. Extraemos los valores numéricos actuales del objeto global
		const bcv = window.tasasCargadas.bcv.promedio;
		const usdt = window.tasasCargadas.usdt.promedio;
		const euro = window.tasasCargadas.euro.promedio;

	// 2. Validación de seguridad: Evitamos dividir entre cero si la API no ha respondido
		if (bcv === 0 || usdt === 0 || euro === 0) {
			console.warn("⚠️ Aún no se pueden calcular los porcentajes. Las tasas están en cero.");
			return null; // si alguna tasa está en cero, no realiza los calculos correspondientes
		}

	// 3. Realizamos los cálculos matemáticos de las brechas
	// Diferencia entre BCV y usdt
		const diffBcvusdt = ((usdt - bcv) / bcv) * 100;
	// Diferencia entre BCV y Euro
		const diffBcvEuro = ((euro - bcv) / bcv) * 100;
	// Diferencia entre usdt vs BCV
		const diffusdtBCV = ((bcv - usdt) / usdt) * 100;
	// Diferencia entre usdt y Euro
		const diffusdtEuro = ((euro - usdt) / usdt) * 100;
	// Diferencia entre usdt vs BCV
		const diffEuroBCV = ((bcv - euro) / euro) * 100;
	// Diferencia entre usdt y Euro
		const diffEurousdt = ((usdt - euro) / euro) * 100;

	// 4. Construimos y retornamos el nuevo array de JSON solicitado
		const arrayDiferencias = [
		{
			comparacion: "BCV vs usdt",
			descripcion: "% de diferencia USDT con el Dólar Oficial: ",
			porcentaje: parseFloat(diffBcvusdt.toFixed(3)), // Guarda el número a 2 decimales fijos
			texto: diffBcvusdt.toFixed(3) + "%", // Formato estético para imprimir en pantalla
			fecha: tasasCargadas.bcv.fecha
		},
		{
			comparacion: "BCV vs Euro",
			descripcion: "% de diferencia Euro Oficial con el Dólar Oficial: ",
			porcentaje: parseFloat(diffBcvEuro.toFixed(3)),
			texto: diffBcvEuro.toFixed(3) + "%",
			fecha: tasasCargadas.bcv.fecha
		},
		{
			comparacion: "USDT vs BCV",
			descripcion: "% de diferencia Dólar Oficial con el USDT: ",
			porcentaje: parseFloat(diffusdtBCV.toFixed(3)), // Guarda el número a 2 decimales fijos
			texto: diffusdtBCV.toFixed(3) + "%", // Formato estético para imprimir en pantalla
			fecha: tasasCargadas.usdt.fecha
		},
		{
			comparacion: "USDT vs Euro",
			descripcion: "% de diferencia Euro Oficial con el USDT: ",
			porcentaje: parseFloat(diffusdtEuro.toFixed(3)),
			texto: diffusdtEuro.toFixed(3) + "%", // Formato estético para imprimir en pantalla
			fecha: tasasCargadas.usdt.fecha
		},
		{
			comparacion: "EURO vs BCV",
			descripcion: "% de diferencia Dolar oficial con el Euro Oficial: ",
			porcentaje: parseFloat(diffEuroBCV.toFixed(3)), // Guarda el número a 2 decimales fijos
			texto: diffEuroBCV.toFixed(3) + "%", // Formato estético para imprimir en pantalla
			fecha: tasasCargadas.euro.fecha
		},
		{
			comparacion: "EURO vs USDT",
			descripcion: "% de diferencia USDT con el EURO oficial: ",
			porcentaje: parseFloat(diffEurousdt.toFixed(3)),
			texto: diffEurousdt.toFixed(2) + "%", // Formato estético para imprimir en pantalla
			fecha: tasasCargadas.euro.fecha
		}];

	return arrayDiferencias;	// La funcion devuelve el arrayDiferencias construido
	}
//////////////////////////FIN DE LA FUNCION obtenerCotizacionHabil /////////////////////////////////////////////////
	function calcularConversiones(campoModificado) {
		const tBcv = window.tasasCargadas.bcv.promedio || 0;
		const tUsdt = window.tasasCargadas.usdt.promedio || 0;
		const tEuro = window.tasasCargadas.euro.promedio || 0;
				calculoinicial();	//console.log(tBcv+" / "+tUsdt+" / "+tEuro);
		if (tBcv === 0 || tUsdt === 0 || tEuro === 0) return;

		let montoIngresado = parseFloat($("#" + campoModificado).val()) || 0;
		window.calculo.monedaOrigen = campoModificado;
		console.log(window.calculo.montobcv + " || " + window.calculo.montousdt  + " || " + window.calculo.montoeuro);
		if (campoModificado === "montobcv") {
			console.log(campoModificado + " || " + (parseFloat($("#" + campoModificado).val()) || 0));
			window.calculo.montobcv = parseFloat(montoIngresado).toFixed(3);		

			window.calculo.bsbcv = parseFloat(window.calculo.montobcv * tBcv).toFixed(3);

			window.calculo.montousdt = parseFloat(window.calculo.bsbcv / tUsdt).toFixed(3); 

			window.calculo.montoeuro = parseFloat(window.calculo.bsbcv / tEuro).toFixed(3); 

			window.calculo.bsusdt = parseFloat(window.calculo.montousdt * tUsdt).toFixed(3);

			window.calculo.bseuro = parseFloat(window.calculo.montoeuro * tEuro).toFixed(3);

		} else if (campoModificado === "montousdt") {
			console.log(campoModificado + " || " + (parseFloat($("#" + campoModificado).val()) || 0));
			window.calculo.montousdt = parseFloat(montoIngresado).toFixed(3);

			window.calculo.bsusdt = parseFloat(window.calculo.montousdt * tUsdt).toFixed(3);

			window.calculo.montobcv = parseFloat(window.calculo.bsusdt / tBcv).toFixed(3);

			window.calculo.montoeuro = parseFloat(window.calculo.bsusdt / tEuro).toFixed(3);

			window.calculo.bsbcv = parseFloat(window.calculo.montousdt * tBcv).toFixed(3);

			window.calculo.bseuro = parseFloat(window.calculo.montousdt * tEuro).toFixed(3);

		} else if (campoModificado === "montoeuro") {
			console.log(campoModificado + " || " + (parseFloat($("#" + campoModificado).val()) || 0));
			window.calculo.montoeuro = parseFloat(montoIngresado).toFixed(3);

			window.calculo.bseuro = parseFloat(window.calculo.montoeuro * tEuro).toFixed(3);

			window.calculo.montobcv = parseFloat(window.calculo.bseuro / tBcv).toFixed(3);

			window.calculo.montousdt = parseFloat(window.calculo.bseuro / tUsdt).toFixed(3);

			window.calculo.bsbcv = parseFloat(window.calculo.bseuro * tBcv).toFixed(3);

			window.calculo.bsusdt = parseFloat(window.calculo.montoeuro * tUsdt).toFixed(3);

		} else if (campoModificado === "bolivares") {
			console.log(campoModificado + " || " + (parseFloat($("#" + campoModificado).val()) || 0));
			window.calculo.bsbcv = parseFloat(montoIngresado).toFixed(3);
			window.calculo.bsusdt = parseFloat(montoIngresado).toFixed(3);
			window.calculo.bseuro = parseFloat(montoIngresado).toFixed(3);

			window.calculo.montobcv = parseFloat(window.calculo.bseuro / tBcv).toFixed(3);

			window.calculo.montousdt = parseFloat(window.calculo.bseuro / tUsdt).toFixed(3);

			window.calculo.montoeuro = parseFloat(window.calculo.bsusdt / tEuro).toFixed(3);
		}

    // Desactivamos temporalmente para evitar bucles cruzados infinitos
		$('#montobcv, #montousdt, #montoeuro','#bolivares').off('input.calculadora');

	if (!campoModificado) {
		window.calculo.montobcv = parseFloat(window.tasasCargadas.bcv.promedio/window.tasasCargadas.bcv.promedio).toFixed(4);
		window.calculo.montousdt = parseFloat(window.tasasCargadas.bcv.promedio/window.tasasCargadas.usdt.promedio).toFixed(4);
		window.calculo.montoeuro = parseFloat(window.tasasCargadas.bcv.promedio/window.tasasCargadas.euro.promedio).toFixed(4);
		}else{
		if (campoModificado === "montousdt") {
			$('#montobcv').val(window.calculo.montobcv > 0 ? window.calculo.montobcv : '');
			$('#montousdt').val(window.calculo.montousdt > 0 ? window.calculo.montousdt : '');
			$('#montoeuro').val(window.calculo.montoeuro > 0 ? window.calculo.montoeuro : '');

			$("#bolivares").val((window.calculo.montousdt * tUsdt).toFixed(3));
		}
		if (campoModificado === "montoeuro") {
			$('#montobcv').val(window.calculo.montobcv > 0 ? window.calculo.montobcv : '');
			$('#montousdt').val(window.calculo.montousdt > 0 ? window.calculo.montousdt : '');
			$('#montoeuro').val(window.calculo.montoeuro > 0 ? window.calculo.montoeuro : '');

			$("#bolivares").val((window.calculo.montoeuro * tEuro).toFixed(3));
		}
		if (campoModificado === "montobcv") {
			$('#montobcv').val(window.calculo.montobcv > 0 ? window.calculo.montobcv : '');
			$('#montousdt').val(window.calculo.montousdt > 0 ? window.calculo.montousdt : '');
			$('#montoeuro').val(window.calculo.montoeuro > 0 ? window.calculo.montoeuro : '');

			$("#bolivares").val((window.calculo.montobcv * tBcv).toFixed(3));
		}
		if (campoModificado === "bolivares") {
			$('#montobcv').val(window.calculo.montobcv > 0 ? window.calculo.montobcv : '');
			$('#montousdt').val(window.calculo.montousdt > 0 ? window.calculo.montousdt : '');
			$('#montoeuro').val(window.calculo.montoeuro > 0 ? window.calculo.montoeuro : '');
		}
	}


		console.table(window.calculo);
		activarEscuchaInputs();
	}

function activarEscuchaInputs() {
	let temporizadorDebounce; // Variable para controlar el retraso
    $('#montobcv, #montousdt, #montoeuro, #bolivares').on('keydown.calculadora', function(e) {
        const caracterPulsado = e.key;

        // 1. Permitir teclas de control del sistema (Borrar, flechas, tabulador, etc.)
        const teclasControl = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'];
        if (teclasControl.includes(caracterPulsado)) {
            return; // Permitimos la acción y salimos
        }

        // 2. Validar si es un número o un punto decimal
        // Permite dígitos del 0 al 9 y el carácter '.'
        const esNumeroOPunto = /^[0-9.]$/.test(caracterPulsado);

        // 3. (Opcional) Evitar que escriban más de un punto decimal en el mismo input
        if (caracterPulsado === '.' && this.value.includes('.')) {
            e.preventDefault(); // Bloquea el segundo punto
            return;
        }

        // Si no es un número ni un punto, bloqueamos la escritura
        if (!esNumeroOPunto) {
            e.preventDefault();
        }
    });

    // Mantenemos el evento 'input' original para calcular las conversiones en tiempo real
    $('#montobcv, #montousdt, #montoeuro, #bolivares').on('input.calculadora', function() {
        const inputId = this.id;

        // Cancelamos el cálculo anterior si el usuario sigue escribiendo rápido
        clearTimeout(temporizadorDebounce);

        // Programamos el cálculo para 150 milisegundos después de que deje de teclear
        temporizadorDebounce = setTimeout(function() {
            calcularConversiones(inputId);
        }, 150); // Puedes ajustar este número (150ms es imperceptible para el usuario)
    });
}


	function resetCampoTasas() {
		$('#bolivares').val(window.tasasCargadas.bcv.promedio);
		$('#montobcv').val(window.calculo.montobcv);
		$('#montousdt').val(window.calculo.montousdt);
		$('#montoeuro').val(window.calculo.montoeuro);
	}
	function calculoinicial(){
		window.calculo.bsbcv= window.tasasCargadas.bcv.promedio;
		window.calculo.bsusdt= window.tasasCargadas.usdt.promedio;
		window.calculo.bseuro= window.tasasCargadas.euro.promedio;		
	}

/* 
#montobcv
#txtBCVUSDT, #txtBCVEURO, #fechaBCV
#resBCVUSDT, #resBCVEURO
#montousdt
#txtUSDTBCV, #txtUSDTEURO, #fechaUSDT
#resUSDTBCV, #resUSDTEURO
#montoeuro
#txtEUROBCV, #txtEUROUSDT, #fechaEURO
#resEUROBCV, #resEUROUSDT

#bcv, #usdt, #euro 
*/
