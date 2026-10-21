import { ConfirmDialog, Toast } from './components/Overlays';
import { Shell } from './components/Shell';
import { Dashboard } from './screens/Dashboard';
import { Data } from './screens/Data';
import { Help } from './screens/Help';
import { Login } from './screens/Login';
import { Portal } from './screens/Portal';
import { Profile } from './screens/Profile';
import { Report } from './screens/Report';
import { Sdq } from './screens/Sdq';
import { StudentList } from './screens/StudentList';
import { Visit } from './screens/Visit';
import { useStore, type Screen } from './state/store';

const SCREENS: Record<Screen, () => JSX.Element | null> = {
  dash: Dashboard, list: StudentList, profile: Profile, sdq: Sdq, visit: Visit, help: Help, report: Report, data: Data,
};

export function App() {
  const { auth, db, route, booting } = useStore();
  let body: JSX.Element | null;
  if (booting) body = null;
  else if (!auth) body = <Login />;
  else if (auth.role !== 't') body = <Portal auth={auth} />;
  else if (!db) body = null;
  else {
    const S = SCREENS[route.screen];
    body = <Shell><S key={route.screen} /></Shell>;
  }
  return (
    <>
      {body}
      <ConfirmDialog />
      <Toast />
    </>
  );
}
