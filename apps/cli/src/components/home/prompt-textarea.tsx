export function PromptTextarea() {
	return (
		<box flexDirection="column" marginTop={1}>
			<text fg="#09ff00">What are we building?</text>
			<textarea
				initialValue=""
				placeholder="Ask yu-code to edit, explain, or create something..."
				width={72}
				height={5}
				focused
				wrapMode="word"
				backgroundColor="#11271c"
				focusedBackgroundColor="#11271c"
				textColor="#95ffba"
				placeholderColor="#6b7280"
				cursorColor="#c7ffe3"
			/>
		</box>
	);
}
