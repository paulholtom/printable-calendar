interface Window {
	// exposed in the `preload.ts`
	configFile: {
		read: () => Promise<string>;
		write: (config: string) => Promise<void>;
	};
}
