import { StudioProvider } from '../../components/studio/StudioProvider';

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioProvider>{children}</StudioProvider>;
}
