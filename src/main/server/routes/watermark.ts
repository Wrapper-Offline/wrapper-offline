import Database from "../../storage/database.js";
import { Group } from "@octanuary/httpz";

const XML_HEADER = process.env.XML_HEADER;
const group = new Group();

/*
just some helpful information
==========
default watermark: 0vTLbQy9hG7k
no watermark: 0dhteqDBt5nY
*/

/*
assign
*/
group.route("POST", /\/goapi\/assignwatermark\/movie\/([\S]+)\/([\S]+)/, (req, res) => {
	const mId = req.matches[1];
	let wId = req.matches[2];
	// reset the watermark if it's the no watermark id
	if (wId == "0dhteqDBt5nY") wId = undefined;

	if (Database.update("movies", mId, { watermark: wId })) {
		res.end("0");
	} else {
		res.status(404).end("1Movie doesn't exist.");
	}
});

/*
list
*/
group.route("POST", "/goapi/getUserWatermarks/", (req, res) => {
	const mId = req.body.movieId;
	let wId = null;
	if (mId) {
		const movie = Database.get("movies", mId);
		if (!movie) {
			return res.status(404).end();
		}
		wId = movie.data.watermark;
	}

	const list = Database.select("assets", { type: "watermark" });
	res.setHeader("Content-Type", "application/xml");
	res.end(`${XML_HEADER}<watermarks>${
		list.map((w) => `<watermark id="${w.id}" thumbnail="/assets/${w.id}"/>`).join("")
	}${wId !== null ? `<preview>${wId}</preview>` : ""}</watermarks>`);
});

/*
load
*/
group.route("POST", "/goapi/getMovieInfo/", (req, res) => {
	const mId = req.body.movieId;
	const movie = Database.get("movies", mId);
	if (!movie) {
		return res.status(400).end("1Movie not found.");
	}

	const wId = movie.data.watermark;
	res.setHeader("Content-Type", "application/xml");
	res.end(`${XML_HEADER}<watermarks>${
		typeof wId == "undefined" ?
			// no watermark
			`<watermark style="octanuary"/>` : wId == "0vTLbQy9hG7k" ?
				// default watermark
				"" :
				// custom watermark
				`<watermark>/assets/${wId}</watermark>`
	}</watermarks>`);
});

export default group;
