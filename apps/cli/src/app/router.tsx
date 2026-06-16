import { createMemoryRouter, RouterProvider } from "react-router";
import { RootLayout } from "./root-layout";
import { AboutScreen } from "../screens/about/about-screen";
import { HomeScreen } from "../screens/home/home-screen";
import { NotFoundScreen } from "../screens/not-found/not-found-screen";
import { SettingsScreen } from "../screens/settings/settings-screen";

const router = createMemoryRouter([
	{
		path: "/",
		element: <RootLayout />,
		children: [
			{ index: true, element: <HomeScreen /> },
			{ path: "about", element: <AboutScreen /> },
			{ path: "settings", element: <SettingsScreen /> },
			{ path: "*", element: <NotFoundScreen /> },
		],
	},
]);

export function AppRouter() {
	return <RouterProvider router={router} />;
}
