import React from 'react';

const steps = [
  {
    title: 'Bienvenue 👋',
    text: 'Découvrez rapidement comment utiliser l’application. Vous pouvez ignorer ce tutoriel à tout moment.'
  },
  {
    title: 'Créer un membre',
    text: 'Depuis Personnel, cliquez sur “Nouveau membre” pour ajouter un collaborateur.'
  },
  {
    title: 'Lancer une évaluation',
    text: 'Depuis la fiche d’un membre, cliquez sur “Nouvelle évaluation” pour démarrer.'
  },
  {
    title: 'Consulter les statistiques',
    text: 'La page Statistiques présente les performances globales et individuelles.'
  },
  {
    title: 'Sauvegardes et brouillons',
    text: 'Vos saisies sont auto-sauvegardées. Retrouvez-les dans l’onglet “Sauvegardes”.'
  }
];

export const OnboardingTour: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    try {
      const seen = localStorage.getItem('onboardingSeen');
      if (!seen) setOpen(true);
    } catch {}
  }, []);

  if (!open) return null;
  const step = steps[index];

  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/40" onClick={() => { localStorage.setItem('onboardingSeen','1'); setOpen(false); }} />
      <div className="absolute bottom-8 right-8 max-w-md w-[92vw] sm:w-[420px] bg-white rounded-xl shadow-2xl border border-slate-200 p-5">
        <h3 className="text-lg font-bold mb-2">{step.title}</h3>
        <p className="text-sm text-slate-700 mb-4">{step.text}</p>
        <div className="flex items-center justify-between">
          <button
            className="text-sm text-slate-500 hover:text-slate-700"
            onClick={() => { localStorage.setItem('onboardingSeen','1'); setOpen(false); }}
          >Ignorer</button>
          <div className="flex items-center gap-2">
            <div className="text-xs text-slate-500">{index+1}/{steps.length}</div>
            {index > 0 && (
              <button
                className="px-3 py-1 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                onClick={() => setIndex(i => Math.max(0, i-1))}
              >Précédent</button>
            )}
            {index < steps.length-1 ? (
              <button
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                onClick={() => setIndex(i => Math.min(steps.length-1, i+1))}
              >Suivant</button>
            ) : (
              <button
                className="px-3 py-1 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                onClick={() => { localStorage.setItem('onboardingSeen','1'); setOpen(false); }}
              >Terminer</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
