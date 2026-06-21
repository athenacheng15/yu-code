import { createMemoryRouter, RouterProvider } from "react-router";
import { RootLayout } from "./root-layout";
import { ChatScreen } from "../screens/chat/chat-screen";
import { HomeScreen } from "../screens/home/home-screen";

const router = createMemoryRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{ index: true, element: <HomeScreen /> },
			{ path: "chat", element: <ChatScreen /> },
		],
	},
]);

export function AppRouter() {
	return <RouterProvider router={router} />;
}
