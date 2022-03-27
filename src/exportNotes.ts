import { App, Editor, htmlToMarkdown, Notice } from "obsidian";
import { getCAYWJSON, getNotesFromCiteKeys } from "./cayw";
import { Database } from "./types";

export async function noteExportPrompt(database: Database) {
	const json = await getCAYWJSON(database);

	if (!json) return;

	const citeKeys = json
		.map((e: any) => {
			return e.citekey;
		})
		.filter((e: any) => !!e);

	if (!citeKeys.length) return;

	const notes = await getNotesFromCiteKeys(citeKeys, database);

	if (!notes) return;

	const noteKeys = Object.keys(notes);

	if (!noteKeys.length) {
		new Notice("No notes found for selected items", 7000);
		return;
	}

	const notesMarkdown: Record<string, string> = {};

	noteKeys.forEach((key) => {
		notesMarkdown[key] = notes[key]
			.map((n: string) => htmlToMarkdown(n))
			.join("\n\n");
	});

	return notesMarkdown;
}

export function insertNotesIntoCurrentDoc(
	editor: Editor,
	notes: Record<string, string>
) {
	editor.replaceSelection(Object.values(notes).join("\n\n"));
}

export async function filesFromNotes(
	app: App,
	folder: string,
	notes: Record<string, string>
) {
	const keys = Object.keys(notes);

	for (let i = 0, len = keys.length; i < len; i++) {
		if (!(await newFile(app, folder, keys[i], notes[keys[i]]))) {
			break;
		}
	}
}

export async function newFile(
	app: App,
	folder: string,
	citeKey: string,
	content: string
) {
	const target = !folder.endsWith("/") ? folder + "/" : folder;

	if (!app.vault.getAbstractFileByPath(target)) {
		await app.vault.createFolder(target);
	}

	try {
		return await app.vault.create(`${target}${citeKey}.md`, content);
	} catch (e) {
		console.error(e);
		new Notice(
			`Error creating file ${target}${citeKey}.md: ${e.message}`,
			10000
		);
		return null;
	}
}
