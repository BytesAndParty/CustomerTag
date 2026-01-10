import { App, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from "obsidian";

// TODO: Konfigurierbarer Ziel-Ordner - aktuell werden Customer-Ordner im Root erstellt
// Könnte erweitert werden zu z.B. "Customers/CustomerName" statt nur "CustomerName"

// Security: Characters not allowed in folder names
const INVALID_FOLDER_CHARS = /[\\/:*?"<>|]/g;

/**
 * Sanitizes a folder name to prevent path traversal and invalid characters
 * @param name The folder name to sanitize
 * @returns Sanitized folder name or null if invalid
 */
function sanitizeFolderName(name: string): string | null {
	if (!name || typeof name !== "string") {
		return null;
	}

	// Trim whitespace
	let sanitized = name.trim();

	// Check for path traversal attempts
	if (sanitized.includes("..") || sanitized.startsWith("/") || sanitized.startsWith("\\")) {
		return null;
	}

	// Remove invalid characters
	sanitized = sanitized.replace(INVALID_FOLDER_CHARS, "");

	// Check if anything remains after sanitization
	if (!sanitized || sanitized.length === 0) {
		return null;
	}

	// Limit length to prevent filesystem issues
	if (sanitized.length > 255) {
		sanitized = sanitized.substring(0, 255);
	}

	return sanitized;
}

interface CustomerTagSorterSettings {
	sourceFolder: string;
	runOnStartup: boolean;
}

const DEFAULT_SETTINGS: CustomerTagSorterSettings = {
	sourceFolder: "Notes",
	runOnStartup: true,
};

export default class CustomerTagSorterPlugin extends Plugin {
	settings: CustomerTagSorterSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		// Command für manuelles Auslösen
		this.addCommand({
			id: "sort-customer-files",
			name: "Sort files by Customer tag",
			callback: () => this.sortFilesByCustomer(),
		});

		// Bei Startup ausführen (wenn aktiviert)
		if (this.settings.runOnStartup) {
			this.app.workspace.onLayoutReady(() => {
				this.sortFilesByCustomer();
			});
		}

		// Settings Tab hinzufügen
		this.addSettingTab(new CustomerTagSorterSettingTab(this.app, this));
	}

	async sortFilesByCustomer() {
		const { vault } = this.app;
		const sourceFolder = vault.getAbstractFileByPath(this.settings.sourceFolder);

		if (!sourceFolder || !(sourceFolder instanceof TFolder)) {
			new Notice(`Source folder "${this.settings.sourceFolder}" not found!`);
			return;
		}

		let movedCount = 0;
		let skippedCount = 0;
		let errorCount = 0;
		const filesToProcess: TFile[] = [];

		// Alle Markdown-Dateien im Source-Folder sammeln
		for (const child of sourceFolder.children) {
			if (child instanceof TFile && child.extension === "md") {
				filesToProcess.push(child);
			}
		}

		for (const file of filesToProcess) {
			const rawCustomer = this.getCustomerFromFrontmatter(file);

			if (rawCustomer) {
				// Security: Sanitize the customer name to prevent path traversal
				const customer = sanitizeFolderName(rawCustomer);

				if (!customer) {
					console.warn(`[CustomerTag] Invalid customer name in ${file.path}: "${rawCustomer}"`);
					skippedCount++;
					continue;
				}

				const targetFolderPath = customer;

				try {
					// Ziel-Ordner erstellen falls nicht vorhanden
					let targetFolder = vault.getAbstractFileByPath(targetFolderPath);
					if (!targetFolder) {
						await vault.createFolder(targetFolderPath);
						// Wait briefly for filesystem sync
						await new Promise(resolve => setTimeout(resolve, 50));
						targetFolder = vault.getAbstractFileByPath(targetFolderPath);
					}

					if (!targetFolder || !(targetFolder instanceof TFolder)) {
						console.error(`[CustomerTag] Failed to create/access folder: ${targetFolderPath}`);
						errorCount++;
						continue;
					}

					const newPath = `${targetFolderPath}/${file.name}`;

					// Prüfen ob Datei bereits existiert
					const existingFile = vault.getAbstractFileByPath(newPath);
					if (existingFile) {
						skippedCount++;
						continue;
					}

					await vault.rename(file, newPath);
					movedCount++;
				} catch (error) {
					console.error(`[CustomerTag] Error moving ${file.path}:`, error);
					errorCount++;
				}
			}
		}

		// Build notification message
		const messages: string[] = [];
		if (movedCount > 0) messages.push(`Moved ${movedCount} file(s)`);
		if (skippedCount > 0) messages.push(`Skipped ${skippedCount}`);
		if (errorCount > 0) messages.push(`Errors: ${errorCount}`);

		if (messages.length > 0) {
			new Notice(messages.join(", "));
		} else {
			new Notice("No files to move.");
		}
	}

	getCustomerFromFrontmatter(file: TFile): string | null {
		const cache = this.app.metadataCache.getFileCache(file);

		if (cache?.frontmatter && cache.frontmatter["Customer"]) {
			return cache.frontmatter["Customer"];
		}

		return null;
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CustomerTagSorterSettingTab extends PluginSettingTab {
	plugin: CustomerTagSorterPlugin;

	constructor(app: App, plugin: CustomerTagSorterPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Customer Tag Sorter Settings" });

		new Setting(containerEl)
			.setName("Source Folder")
			.setDesc("The folder to scan for files with Customer tags")
			.addText((text) =>
				text
					.setPlaceholder("Notes")
					.setValue(this.plugin.settings.sourceFolder)
					.onChange(async (value) => {
						this.plugin.settings.sourceFolder = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Run on Startup")
			.setDesc("Automatically sort files when Obsidian starts")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.runOnStartup)
					.onChange(async (value) => {
						this.plugin.settings.runOnStartup = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Manual Sort")
			.setDesc("Manually trigger the sorting process")
			.addButton((button) =>
				button.setButtonText("Sort Now").onClick(async () => {
					await this.plugin.sortFilesByCustomer();
				})
			);
	}
}
