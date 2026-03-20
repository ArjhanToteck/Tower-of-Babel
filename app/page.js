"use client";

import LoadingBar from "@/src/components/LoadingBar";
import { useEffect, useState } from "react";
import { error } from "three";


const translationApis = ["https://lingva.ml", "https://translate.plausibility.cloud", "https://lingva.lunar.icu", "https://lingva.garudalinux.org"];
const translationCount = 10;

export default function Page() {
	const [translationApi, setTranslationApi] = useState(translationApis[0]);
	const [languages, setLanguages] = useState([]);
	const [translation, setTranslation] = useState("");
	const [inputDisabled, setInputDisabled] = useState(false);
	const [loadHidden, setLoadHidden] = useState(true);
	const [loadPercentage, setLoadPercentage] = useState(0);
	const [loadLabel, setLoadLabel] = useState("Loading...");
	const [apiErrorHidden, setApiErrorHidden] = useState(true);

	useEffect(() => {
		tryApi(0);

		function tryApi(apiIndex) {
			// try the next translation API to see if it's online
			const newTranslationApi = translationApis[apiIndex];
			console.log("trying " + newTranslationApi);

			// get languages
			fetch(newTranslationApi + "/api/v1/languages")
				.then((response) => {
					if (!response.ok) {
						alert("issue");
						throw new Error(`Request failed: ${response.status} ${response.statusText}`);
					}

					return response.json();
				})
				.then((data) => {

					console.log("found " + newTranslationApi);
					setTranslationApi(newTranslationApi);

					const loadedLanguages = data.languages;

					// remove first language (since the first one's just autodetect)
					loadedLanguages.shift();

					// update state
					setLanguages(loadedLanguages);
				})
				.catch((error) => {
					console.error("Failed to fetch language list:", error);

					if (apiIndex < translationApis.length - 1) {
						console.log("continue");
						// try next API
						tryApi(apiIndex + 1);
					} else {
						// disable input
						setInputDisabled(true);

						// show error
						setApiErrorHidden(false);
					}
				});
		}
	}, []);

	return (
		<main>
			<section>
				<h1>Tower of Babel</h1>
				<p>I originally made when I was 12. I thought it was entertaining to take a sentence or paragraph through Google Translate a bunch of times and then translate it back into English like a game of broken telephone. So, 12-year-old me created this program to automate the process. </p>

				<p>Input a phrase, sentence, or paragraph below and hit "translate" or the enter key to watch go through repeated translation.</p>

				<p style={{ display: apiErrorHidden ? "none" : "block" }}>Unfortunately, there was an error reaching the translation API. Please try again later.</p>

				<br />

				<textarea
					placeholder="Enter a phrase, sentence, or paragraph here and hit enter."
					value={translation}
					onChange={(event) => setTranslation(event.target.value)}
					style={{ width: "50%", height: "100px" }}
					disabled={inputDisabled}
				/>

				<br />

				<LoadingBar percentage={loadPercentage} label={loadLabel} hidden={loadHidden} />

				<br />

				<button disabled={inputDisabled} onClick={repeatedTranslate}>Translate</button>

			</section>
		</main>
	);

	async function repeatedTranslate() {
		// disable input
		setInputDisabled(true);

		// show loading bar at 0
		setLoadHidden(false);
		setLoadPercentage(0);

		// get initial translation
		let newTranslation = translation;

		// loop for translationCount
		for (let i = 0; i < translationCount; i++) {
			// get random language
			const language = getRandomLanguage();

			// set loading bar label before translate
			setLoadLabel(`Translating to ${language.name} (language ${i + 1}/${translationCount})...`);

			// translate
			newTranslation = await translate(newTranslation, language.code);

			// update state to render it
			setTranslation(newTranslation);

			// update loading percentage (translationCount + 1 to include the final English)
			setLoadPercentage(i / (translationCount + 1));
		}

		// set loading bar label before translate
		setLoadLabel(`Translating back into English (final step)...`);

		// return final translation as english
		const finalTranslation = await translate(newTranslation, "en");
		setTranslation(finalTranslation);

		// done loading
		setLoadLabel(`Translated ${translationCount} times and back into English.`);
		setLoadPercentage(1);

		// enable input
		setInputDisabled(false);
	}

	async function translate(query, targetLanguage) {
		let sanitizedQuery = query;

		// replace slashes
		// it doesn't allow slashes or %2F for some reason
		sanitizedQuery = sanitizedQuery.replace(/\//g, "");

		sanitizedQuery = encodeURIComponent(sanitizedQuery);

		const response = await fetch(translationApi + `/api/v1/auto/${targetLanguage}/${sanitizedQuery}`);

		if (!response.ok) {
			setLoadLabel("Fetch failed: there was an issue reaching the translation API. It is probably down right now.")
			setLoadPercentage(1);
		}

		const data = await response.json();

		return data.translation;
	}

	function getRandomLanguage() {
		return languages[Math.floor(Math.random() * languages.length)];
	}
}