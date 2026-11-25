'use client';

import { ProjectsView } from '../projects/ProjectsView';
import { useStudio } from '../studio/StudioProvider';

export function ProjectsPageClient() {
  const { localProjects, handleOpenSavedProject, handleNavigate, editor, setRestoredCollage } =
    useStudio();

  return (
    <ProjectsView
      projects={localProjects.projects}
      storageStats={localProjects.storageStats}
      isLoading={localProjects.isLoading}
      storageError={localProjects.storageError}
      onOpenProject={(proj) => void handleOpenSavedProject(proj)}
      onRenameProject={localProjects.renameProject}
      onDeleteProject={localProjects.removeProject}
      onClearAllProjects={localProjects.wipeProjects}
      onCreateNew={(target) => {
        if (target === 'collage') {
          setRestoredCollage(null);
        } else if (target === 'editor') {
          editor.clearImage();
        }
        handleNavigate(target);
      }}
    />
  );
}
