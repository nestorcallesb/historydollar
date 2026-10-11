
	window.urls = [
		urlbcv = "https://ve.dolarapi.com/v1/dolares/oficial",
		urlusdt = "https://ve.dolarapi.com/v1/dolares/paralelo",
		urleuro = "https://ve.dolarapi.com/v1/euros/oficial",
		urlhdolar = 'https://ve.dolarapi.com/v1/historicos/dolares',
		urlheuro = 'https://ve.dolarapi.com/v1/historicos/euros'
	];
    
	window.tasasCargadas = {
		bcv: {promedio: 0, fecha: "" },
		usdt: {promedio: 0, fecha: "" },
		euro: {promedio: 0, fecha: "" }
	};

	window.calculo = {
		monedaOrigen: "", // Sabrá cuál campo modificó el usuario ('bcv', 'usdt' o 'euro')
		bsbcv: 0,	// El resultado en Bolívares para la tasa BCV
		bsusdt: 0,	// El resultado en Bolívares para la tasa USDT
		bseuro: 0,	// El resultado en Bolívares para la tasa EURO
		montobcv: "1.00",	// El resultado en USD BCV
		montousdt: "1.00",	// El resultado en USDT
		montoeuro: "1.00"	// El resultado en Euro

	};

	window.arrayDiferencias = [	];
