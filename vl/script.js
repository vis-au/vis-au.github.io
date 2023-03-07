const EMBED_TOAST_ID = "#on-embed-toast";
const VIDEO_EMBEDS = [
	{
		id: 1,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=a5741e0a-e5fa-4aa3-9d4f-af93014be3c1&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 1.1,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=57403d63-e43d-49b4-9106-af93014be392&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 2,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=510173d1-e615-4307-b867-af90009b2dfa&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 3,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=36fd99c4-e93f-4fa6-b776-af90009b9145&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 3.1,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=2abcee26-ab82-434c-94f8-af90009ae6f3&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 3.2,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=3c3d50fb-955c-4ffe-b5d7-af9901408733&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 3.3,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=930253bd-3b15-4951-b9b1-af90009a7ea7&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 3.4,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=6b54bbb3-7851-49ef-9376-af9901408705&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 3.5,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=5cd7d8e4-28bd-4b23-a7b5-af90009ad205&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 4,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=70883839-bf3a-40c6-95f5-af90009bf1c4&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 4.1,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=d7c1a11e-2186-4412-aa06-af9500a9a112&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 4.2,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=af92eee7-4090-4ac4-80f8-af9d00f9aea7&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 5,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=54b67cf5-e8f6-43df-bbee-af8c00b4a355&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 5.1,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=ebd4e4f5-7b51-4592-a67d-af9601049695&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 5.2,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=bc0fa5dd-d20a-4777-afca-af97011644c2&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 5.3,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=82a359c6-66b8-47be-90ba-af9d01146ada&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 6,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=969e06c0-31f8-4a17-b901-af8c00b4a359&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 6.1,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=0d94ed9c-2a8e-4ee6-a191-af99015d3806&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 6.2,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=a452e482-65c7-43c8-8cba-af8c00b4af40&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 6.3,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=2d107f03-f556-4eaf-9bb0-af8c00b4af53&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 7,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=4d8ca6c3-cf23-4589-9d16-af8c00b4b2b6&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 7.1,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=2061d015-73b0-49f6-b24e-af8c00b4b732&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 7.2,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=09b0a843-0051-46de-b010-af8c00b4ca6c&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 7.3,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=45156b71-08ea-4992-bc77-af8c00b4d3d1&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 7.4,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=1b321938-bf88-4933-8020-af9000a17ce3&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 8,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=dbc3ffc3-db70-409c-9246-af9900eb78da&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 9.1,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=5729d416-8336-441a-bb04-afa40110fdc1&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 9.2,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=cd3600a0-9ced-4903-b424-afa1009c7a05&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 9.3,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=7df34e05-4dc8-446f-ae91-afa50128ccd9&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 10.1,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=f4d0fd2f-5fb8-41d2-abb1-afa201091500&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 10.2,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=006d7e7a-7325-4d67-83cc-afa20117339e&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
	{
		id: 10.3,
		embed: '<iframe src="https://panopto.au.dk/Panopto/Pages/Embed.aspx?id=74217546-3103-4fad-b397-afba00f09f1e&autoplay=false&offerviewer=true&showtitle=true&showbrand=false&captions=false&interactivity=all" height="405" width="720" style="border: 1px solid #464646;" allowfullscreen allow="autoplay"></iframe>',
	},
];
document.querySelectorAll(".copy-embed").forEach((icon) => {
	icon.addEventListener("click", (event) => {
		const videoId = getVideoId(event.target);
		if(videoId){
			const embedCode = getEmbedCode(videoId);
			navigator.clipboard.writeText(embedCode.embed);
			showToast(EMBED_TOAST_ID);
			window.setInterval(() => {
				hideToast(EMBED_TOAST_ID);
			}, 4000);
		}
	});
});

function getEmbedCode(videoId) {
	let datum = VIDEO_EMBEDS.find(v=> v.id.toString() === videoId);
	return datum.embed;
}

function getVideoId(innerElement) {
	const listItem = innerElement.closest("li");
	return listItem.getAttribute("video-id");
}

function showToast(id) {
	document.querySelector(id).classList.add("activated");
}

function hideToast(id) {
	document.querySelector(id).classList.remove("activated");
}
