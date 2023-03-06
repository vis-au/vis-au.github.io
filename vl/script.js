const EMBED_TOAST_ID = "#on-embed-toast";
document.querySelectorAll(".copy-embed").forEach((icon) => {
	icon.addEventListener("click", (event) => {
		showToast(EMBED_TOAST_ID);
		window.setInterval(() => {
			hideToast(EMBED_TOAST_ID);
		}, 4000);
	});
});

function showToast(id) {
	document.querySelector(id).classList.add("activated");
}

function hideToast(id) {
	document.querySelector(id).classList.remove("activated");
}
