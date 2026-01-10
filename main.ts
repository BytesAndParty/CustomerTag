import { App, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder } from "obsidian";

// TODO: Konfigurierbarer Ziel-Ordner - aktuell werden Customer-Ordner im Root erstellt
// Könnte erweitert werden zu z.B. "Customers/CustomerName" statt nur "CustomerName"

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
		const filesToProcess: TFile[] = [];

		// Alle Markdown-Dateien im Source-Folder sammeln
		for (const child of sourceFolder.children) {
			if (child instanceof TFile && child.extension === "md") {
				filesToProcess.push(child);
			}
		}

		for (const file of filesToProcess) {
			const customer = this.getCustomerFromFrontmatter(file);

			if (customer) {
				const targetFolderPath = customer;

				// Ziel-Ordner erstellen falls nicht vorhanden
				let targetFolder = vault.getAbstractFileByPath(targetFolderPath);
				if (!targetFolder) {
					await vault.createFolder(targetFolderPath);
					targetFolder = vault.getAbstractFileByPath(targetFolderPath);
				}

				if (targetFolder instanceof TFolder) {
					const newPath = `${targetFolderPath}/${file.name}`;

					// Prüfen ob Datei bereits existiert
					const existingFile = vault.getAbstractFileByPath(newPath);
					if (!existingFile) {
						await vault.rename(file, newPath);
						movedCount++;
					}
				}
			}
		}

		if (movedCount > 0) {
			new Notice(`Moved ${movedCount} file(s) to customer folders.`);
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
