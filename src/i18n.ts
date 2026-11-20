export type Lang = 'fr' | 'en';

export interface Translations {
  brandTitle: string;
  pageTitle: string;
  nav: {
    simulateur: string;
    dose_reponse: string;
    scenarios: string;
    modele: string;
  };
  exportJson: string;
  ribbon: {
    scenariosLabel: string;
    mucusProfileLabel: string;
    customCalibration: string;
    languageLabel: string;
  };
  presets: Record<string, { label: string; summary: string }>;
  scenarios: Record<string, { label: string; description: string }>;
  status: {
    apoptotic: { label: string; detail: string };
    leakyGut: { label: string; detail: string };
    elevated: { label: string; detail: string };
    reinforced: { label: string; detail: string };
    intact: { label: string; detail: string };
  };
  sidebar: {
    title: string;
    reset: string;
    metabolitesSection: string;
    butyrateMode: string;
    cocktailMode: string;
    luminalButyrate: string;
    propionate: string;
    acetate: string;
    ipa: string;
    supplyKinetics: string;
    kineticsConstant: string;
    kineticsPostprandial: string;
    kineticsBolus: string;
    inflammationSection: string;
    stimulusLabel: string;
    inflammationProfile: string;
    infConstant: string;
    infLpsChallenge: string;
    kTransLabel: string;
    calibrationSection: string;
    mucusAttenuation: string;
    ampkGain: string;
    toxThreshold: string;
    timeHorizon: string;
  };
  kpi: {
    teerTitle: string;
    pappTitle: string;
    lmTitle: string;
    lmThreshold: string;
    tjViabilityTitle: string;
    maxLabel: string;
    viabilityLabel: string;
    ampkLabel: string;
  };
  playback: {
    play: string;
    pause: string;
    scrubberAria: string;
  };
  diagram: {
    title: string;
    instant: string;
    ariaLabel: string;
    lumenHeader: string;
    mucusLayer: string;
    noMucus: string;
    colonocyteA: string;
    colonocyteB: string;
    laminaPropria: string;
    viabilityShort: string;
    legendMetabolites: string;
    legendInflammation: string;
    legendTj: string;
    legendFlux: string;
  };
  chart: {
    titlePrefix: string;
    subtitle: string;
    tabBio: string;
    tabOde: string;
    time: string;
    teer: string;
    papp: string;
    lmRatio: string;
    deltaPerm: string;
    ampkState: string;
    infState: string;
    tjState: string;
    viabState: string;
    axisTeer: string;
    axisOdePct: string;
    axisPapp: string;
    axisOdeUnits: string;
    leakyThreshold: string;
    legendTeer: string;
    legendPapp: string;
    legendBaselineTeer: string;
    legendAmpk: string;
    legendTj: string;
    legendInf: string;
    legendViab: string;
  };
  doseResponse: {
    title: string;
    subtitleStart: string;
    subtitleMid: string;
    subtitleEnd: string;
    luminalRange: string;
    inspectedDose: string;
    teerAndPapp: string;
    optimalWindow: string;
    minPapp: string;
    statusAtDose: string;
    viability: string;
    axisTeerPrefix: string;
    axisPappPrefix: string;
    legendActiveTeer: string;
    legendActivePapp: string;
    legendRefInVitro: string;
    clickHint: string;
  };
  scenariosView: {
    title: string;
    subtitle: string;
    activeSimLabel: string;
    activeSimDesc: string;
    colScenario: string;
    colTj: string;
    colViability: string;
    colTeer: string;
    colDeltaTeer: string;
    colPapp: string;
    colDeltaP: string;
    colLm: string;
    colStatus: string;
    colAction: string;
    activeBadge: string;
    loadBtn: string;
  };
  modelSpec: {
    title: string;
    subtitle: string;
    eq1Title: string;
    eq1Note: string;
    eq2Title: string;
    eq2Note: string;
    eq3Title: string;
    eq4Title: string;
    eq5Title: string;
    payloadTitle: string;
    payloadSubtitle: string;
    copyJson: string;
    copied: string;
    apiTitle: string;
    apiSubtitle: string;
    testApiBtn: string;
    testingApi: string;
    apiEndpointsLabel: string;
    mcpStdioLabel: string;
  };
  disclaimer: {
    badge: string;
    banner: string;
    footer: string;
  };
}

export const TRANSLATIONS: Record<Lang, Translations> = {
  fr: {
    brandTitle: 'DTHP · Barrière Intestinale',
    pageTitle: 'DTHP · Barrière Intestinale',
    nav: {
      simulateur: 'Simulateur',
      dose_reponse: 'Dose-Réponse',
      scenarios: 'Scénarios',
      modele: 'Modèle ODE',
    },
    exportJson: 'Exporter JSON',
    ribbon: {
      scenariosLabel: 'Scénarios :',
      mucusProfileLabel: 'Profil muqueux :',
      customCalibration: 'Calibrage personnalisé',
      languageLabel: 'Langue',
    },
    presets: {
      in_vitro_caco2: {
        label: 'Modèle In Vitro Caco-2',
        summary: 'Monocouche sans mucus (f_mucus = 1,00) · Calibrage expérimental direct',
      },
      in_vivo_sain: {
        label: 'Patient In Vivo Sain',
        summary: 'Couche de mucus intacte (f_mucus = 0,25) · Colonocytes protégés jusqu’à 20 mM luminal',
      },
      in_vivo_colite: {
        label: 'Patient MICI / Mucus Dégradé',
        summary: 'Barrière muqueuse amincie (f_mucus = 0,60) · Translocation LPS amplifiée',
      },
    },
    scenarios: {
      basal_sain: {
        label: '1. Basal sain (0 mM)',
        description: 'État épithélial Caco-2 de référence sans supplémentation ni stress inflammatoire.',
      },
      butyrate_physio: {
        label: '2. Butyrate physiologique (2 mM)',
        description: 'Activation AMPK/PKCβ2 et inhibition HDAC renforçant l’assemblage des jonctions serrées.',
      },
      challenge_inflammatoire: {
        label: '3. Challenge inflammatoire (S_inf = 0,10)',
        description: 'Stress LPS/TNF-α sans butyrate : désassemblage des jonctions et boucle de translocation.',
      },
      sauvetage_therapeutique: {
        label: '4. Sauvetage thérapeutique (Inflam. + 2 mM)',
        description: 'Le butyrate (2 mM) neutralise l’inflammation NF-κB et restaure le ratio L/M sous 0,05.',
      },
      surcharge_paradoxale: {
        label: '5. Surcharge paradoxale (8 mM direct)',
        description: 'Effet biphasique : sans tampon muqueux (f_mucus = 1,0), 8 mM induit l’apoptose épithéliale.',
      },
    },
    status: {
      apoptotic: {
        label: 'Rupture Apoptotique',
        detail: 'Cytotoxicité directe des AGCC non tamponnés sur la monocouche épithéliale.',
      },
      leakyGut: {
        label: 'Alerte Leaky Gut',
        detail: 'Ratio Lactulose/Mannitol > 0,05 : hyperperméabilité paracellulaire pathologique.',
      },
      elevated: {
        label: 'Perméabilité Élevée',
        detail: 'Fragilisation modérée des jonctions serrées (zone de vigilance).',
      },
      reinforced: {
        label: 'Barrière Renforcée',
        detail: 'Assemblage optimal ZO-1 / Occludine via signalisation AMPK/HDACi.',
      },
      intact: {
        label: 'Barrière Intègre',
        detail: 'Homéostasie paracellulaire basale conforme aux valeurs physiologiques.',
      },
    },
    sidebar: {
      title: 'Paramètres d’Entrée',
      reset: 'Réinitialiser',
      metabolitesSection: 'Métabolites Microbiens',
      butyrateMode: 'Butyrate',
      cocktailMode: 'Cocktail',
      luminalButyrate: 'Butyrate luminal',
      propionate: 'Propionate (w = 0,45)',
      acetate: 'Acétate (w = 0,15)',
      ipa: 'Indole-3-propionate (AhR, w = 0,65)',
      supplyKinetics: 'Cinétique d’apport B(t)',
      kineticsConstant: 'Concentration stationnaire',
      kineticsPostprandial: 'Fermentation post-prandiale (3 pics / 24h)',
      kineticsBolus: 'Bolus thérapeutique aigu (t = 6 h)',
      inflammationSection: 'Stress Inflammatoire & Translocation',
      stimulusLabel: 'Stimulus',
      inflammationProfile: 'Profil inflammatoire',
      infConstant: 'Stress chronique continu',
      infLpsChallenge: 'Challenge LPS aigu à t = 4 h',
      kTransLabel: 'Rétroaction',
      calibrationSection: 'Calibrage Épithélial Patient',
      mucusAttenuation: 'Atténuation mucus',
      ampkGain: 'Gain AMPK',
      toxThreshold: 'Seuil cytotoxique',
      timeHorizon: 'Horizon temporel',
    },
    kpi: {
      teerTitle: 'TEER Épithéliale',
      pappTitle: 'Perméabilité',
      lmTitle: 'Ratio Lactulose / Mannitol',
      lmThreshold: 'seuil 0,050',
      tjViabilityTitle: 'Intégrité TJ & Viabilité V',
      maxLabel: 'max',
      viabilityLabel: 'Viabilité',
      ampkLabel: 'AMPK',
    },
    playback: {
      play: 'Animer',
      pause: 'Pause',
      scrubberAria: 'Curseur temporel de la simulation',
    },
    diagram: {
      title: 'Coupe Transépithéliale & Assemblage des Jonctions Serrées',
      instant: 'Instant t =',
      ariaLabel: 'Schéma mécaniste de la barrière épithéliale intestinale et des jonctions serrées',
      lumenHeader: 'LUMIÈRE INTESTINALE (MÉTABOLITES & ANTIGÈNES)',
      mucusLayer: 'Couche de mucus (atténuation f =',
      noMucus: 'Monocouche Caco-2 exposée (sans mucus, f = 1,00)',
      colonocyteA: 'Colonocyte A',
      colonocyteB: 'Colonocyte B',
      laminaPropria: 'LAMINA PROPRIA · COMPARTIMENT BASOLATÉRAL',
      viabilityShort: 'Viabilité V =',
      legendMetabolites: 'Métabolites (Butyrate / AGCC)',
      legendInflammation: 'Stress inflammatoire (LPS / TNF-α)',
      legendTj: 'Complexes TJ (ZO-1 / Occludine)',
      legendFlux: 'Flux paracellulaire',
    },
    chart: {
      titlePrefix: 'Dynamique Temporelle de la Barrière',
      subtitle: 'Survolez pour inspecter les coordonnées exactes · Cliquez pour synchroniser la coupe cellulaire',
      tabBio: 'Biomarqueurs',
      tabOde: 'Variables ODE (A, I, TJ, V)',
      time: 'Temps',
      teer: 'TEER',
      papp: 'Papp (FD4)',
      lmRatio: 'Ratio L/M',
      deltaPerm: 'Δ Perméabilité',
      ampkState: 'AMPK / HDACi A(t)',
      infState: 'Inflammation I(t)',
      tjState: 'Intégrité TJ(t)',
      viabState: 'Viabilité V(t)',
      axisTeer: 'TEER (Ω·cm²)',
      axisOdePct: 'A(t), V(t) (%)',
      axisPapp: 'Papp FD4 (10⁻⁶ cm/s)',
      axisOdeUnits: 'TJ(t), I(t) (u.a.)',
      leakyThreshold: 'Seuil Alerte Leaky Gut (L/M = 0,05)',
      legendTeer: 'TEER (Ω·cm²) · Axe gauche',
      legendPapp: 'FD4 (10⁻⁶ cm/s) · Axe droit',
      legendBaselineTeer: 'TEER₀ basale',
      legendAmpk: 'Activation AMPK/HDACi A(t)',
      legendTj: 'Intégrité TJ(t)',
      legendInf: 'Charge inflammatoire I(t)',
      legendViab: 'Viabilité épithéliale V(t)',
    },
    doseResponse: {
      title: 'Courbe Dose-Réponse Biphasique (Paradoxe du Butyrate)',
      subtitleStart: 'Comparaison du modèle calibré patient (',
      subtitleMid: ') face à la référence Caco-2 in vitro (',
      subtitleEnd: ') à t =',
      luminalRange: 'Plage luminale :',
      inspectedDose: 'Dose inspectée',
      teerAndPapp: 'TEER &',
      optimalWindow: 'Fenêtre optimale patient',
      minPapp: 'Min',
      statusAtDose: 'Statut à cette dose',
      viability: 'Viabilité :',
      axisTeerPrefix: 'TEER à',
      axisPappPrefix: 'Papp FD4 à',
      legendActiveTeer: 'TEER (Configuration active)',
      legendActivePapp: 'FD4 (Configuration active)',
      legendRefInVitro: 'Référence In Vitro Caco-2',
      clickHint: 'Cliquez sur la courbe pour appliquer la dose au simulateur principal.',
    },
    scenariosView: {
      title: 'Matrice Comparative Multi-Scénarios (Validation à t = 48 h)',
      subtitle: 'Benchmark quantitatif du modèle ODE (calibrage Caco-2 de référence : TEER₀ = 450,5 Ω·cm², P_app,0 = 0,60×10⁻⁶ cm/s) comparé à votre configuration active.',
      activeSimLabel: 'Simulation active (Paramètres courants)',
      activeSimDesc: 'Configuration personnalisée en cours dans le simulateur principal.',
      colScenario: 'Scénario simulé',
      colTj: 'Intégrité TJ',
      colViability: 'Viabilité V',
      colTeer: 'TEER (Ω·cm²)',
      colDeltaTeer: 'ΔTEER',
      colPapp: 'FD4',
      colDeltaP: 'ΔP%',
      colLm: 'Ratio L/M',
      colStatus: 'Statut clinique',
      colAction: 'Action',
      activeBadge: 'Actif',
      loadBtn: 'Charger',
    },
    modelSpec: {
      title: 'Architecture Mathématique Mécaniste (Système ODE)',
      subtitle: 'Intégration temporelle Runge-Kutta d’ordre 4 (RK4 haute résolution, Δt interne = 0,02 h)',
      eq1Title: '1. Activation AMPK / PKCβ2 & Inhibition HDAC',
      eq1Note: 'capture l’atténuation par la couche de mucus et le métabolisme colonocytaire.',
      eq2Title: '2. Dynamique Inflammatoire & Rétroaction « Leaky Gut »',
      eq2Note: 'modélise la translocation paracellulaire d’endotoxines (LPS) qui auto-entretient la réponse NF-κB.',
      eq3Title: '3. Assemblage & Désassemblage des Jonctions Serrées (ZO-1 / Occludine)',
      eq4Title: '4. Viabilité Épithéliale & Cytotoxicité Haute Dose',
      eq5Title: '5. Quantifications Biophysiques (TEER, P_app FD4, Ratio L/M)',
      payloadTitle: 'Payload DTHP (JSON Temps Réel)',
      payloadSubtitle: 'Structure prête pour API FastAPI / couplage MCMM',
      copyJson: 'Copier JSON',
      copied: 'Copié',
      apiTitle: 'Connecteur Agent IA (MCP & API REST)',
      apiSubtitle: 'Exposition déterministe du solveur RK4 pour agents MCP et pipelines HTTP',
      testApiBtn: 'Tester POST /api/simulate',
      testingApi: 'Exécution...',
      apiEndpointsLabel: 'Endpoints HTTP actifs :',
      mcpStdioLabel: 'Configuration MCP stdio (mcp-server.ts) :',
    },
    disclaimer: {
      badge: 'Usage Recherche Uniquement',
      banner:
        'Plateforme de simulation théorique à visée exclusivement scientifique et éducative. Ces modèles mathématiques in silico ne constituent ni un avis médical, ni un diagnostic, ni une recommandation thérapeutique, et ne sont pas validés pour un usage clinique. Consultez toujours un professionnel de santé qualifié.',
      footer:
        'Avertissement légal : Logiciel de modélisation mécaniste fourni « en l’état » à des fins de recherche uniquement (non certifié dispositif médical). L’éditeur décline toute responsabilité en cas d’utilisation clinique, diagnostique ou thérapeutique.',
    },
  },
  en: {
    brandTitle: 'DTHP · Gut Barrier',
    pageTitle: 'DTHP · Gut Barrier Digital Twin',
    nav: {
      simulateur: 'Simulator',
      dose_reponse: 'Dose-Response',
      scenarios: 'Scenarios',
      modele: 'ODE Model',
    },
    exportJson: 'Export JSON',
    ribbon: {
      scenariosLabel: 'Scenarios:',
      mucusProfileLabel: 'Mucus profile:',
      customCalibration: 'Custom calibration',
      languageLabel: 'Language',
    },
    presets: {
      in_vitro_caco2: {
        label: 'In Vitro Caco-2 Model',
        summary: 'Uncoated monolayer (f_mucus = 1.00) · Direct experimental calibration',
      },
      in_vivo_sain: {
        label: 'Healthy In Vivo Patient',
        summary: 'Intact mucus layer (f_mucus = 0.25) · Colonocytes protected up to 20 mM luminal',
      },
      in_vivo_colite: {
        label: 'IBD Patient / Degraded Mucus',
        summary: 'Thinned mucosal barrier (f_mucus = 0.60) · Amplified LPS translocation',
      },
    },
    scenarios: {
      basal_sain: {
        label: '1. Healthy Basal (0 mM)',
        description: 'Baseline Caco-2 epithelial state with no supplementation or inflammatory stress.',
      },
      butyrate_physio: {
        label: '2. Physiological Butyrate (2 mM)',
        description: 'AMPK/PKCβ2 activation and HDAC inhibition reinforcing tight junction assembly.',
      },
      challenge_inflammatoire: {
        label: '3. Inflammatory Challenge (S_inf = 0.10)',
        description: 'LPS/TNF-α stress without butyrate: junctional disassembly and translocation feedback loop.',
      },
      sauvetage_therapeutique: {
        label: '4. Therapeutic Rescue (Inflam. + 2 mM)',
        description: 'Butyrate (2 mM) suppresses NF-κB inflammation and restores L/M ratio below 0.05.',
      },
      surcharge_paradoxale: {
        label: '5. Paradoxical Overload (8 mM direct)',
        description: 'Biphasic effect: without mucus buffering (f_mucus = 1.0), 8 mM triggers epithelial apoptosis.',
      },
    },
    status: {
      apoptotic: {
        label: 'Apoptotic Rupture',
        detail: 'Direct cytotoxicity of unbuffered SCFAs on the epithelial monolayer.',
      },
      leakyGut: {
        label: 'Leaky Gut Alert',
        detail: 'Lactulose/Mannitol ratio > 0.05: pathological paracellular hyperpermeability.',
      },
      elevated: {
        label: 'Elevated Permeability',
        detail: 'Moderate weakening of tight junctions (watch zone).',
      },
      reinforced: {
        label: 'Reinforced Barrier',
        detail: 'Optimal ZO-1 / Occludin assembly driven by AMPK/HDACi signaling.',
      },
      intact: {
        label: 'Intact Barrier',
        detail: 'Basal paracellular homeostasis within physiological reference bounds.',
      },
    },
    sidebar: {
      title: 'Input Parameters',
      reset: 'Reset',
      metabolitesSection: 'Microbial Metabolites',
      butyrateMode: 'Butyrate',
      cocktailMode: 'Cocktail',
      luminalButyrate: 'Luminal butyrate',
      propionate: 'Propionate (w = 0.45)',
      acetate: 'Acetate (w = 0.15)',
      ipa: 'Indole-3-propionate (AhR, w = 0.65)',
      supplyKinetics: 'Supply kinetics B(t)',
      kineticsConstant: 'Steady-state concentration',
      kineticsPostprandial: 'Postprandial fermentation (3 peaks / 24h)',
      kineticsBolus: 'Acute therapeutic bolus (t = 6 h)',
      inflammationSection: 'Inflammatory Stress & Translocation',
      stimulusLabel: 'Stimulus',
      inflammationProfile: 'Inflammatory profile',
      infConstant: 'Continuous chronic stress',
      infLpsChallenge: 'Acute LPS challenge at t = 4 h',
      kTransLabel: 'Feedback',
      calibrationSection: 'Patient Epithelial Calibration',
      mucusAttenuation: 'Mucus attenuation',
      ampkGain: 'AMPK gain',
      toxThreshold: 'Cytotoxic threshold',
      timeHorizon: 'Time horizon',
    },
    kpi: {
      teerTitle: 'Epithelial TEER',
      pappTitle: 'Permeability',
      lmTitle: 'Lactulose / Mannitol Ratio',
      lmThreshold: 'threshold 0.050',
      tjViabilityTitle: 'TJ Integrity & Viability V',
      maxLabel: 'max',
      viabilityLabel: 'Viability',
      ampkLabel: 'AMPK',
    },
    playback: {
      play: 'Play',
      pause: 'Pause',
      scrubberAria: 'Simulation timeline scrubber',
    },
    diagram: {
      title: 'Transepithelial Cross-Section & Tight Junction Assembly',
      instant: 'Time t =',
      ariaLabel: 'Mechanistic diagram of the intestinal epithelial barrier and tight junctions',
      lumenHeader: 'INTESTINAL LUMEN (METABOLITES & ANTIGENS)',
      mucusLayer: 'Mucus layer (attenuation f =',
      noMucus: 'Exposed Caco-2 monolayer (no mucus, f = 1.00)',
      colonocyteA: 'Colonocyte A',
      colonocyteB: 'Colonocyte B',
      laminaPropria: 'LAMINA PROPRIA · BASOLATERAL COMPARTMENT',
      viabilityShort: 'Viability V =',
      legendMetabolites: 'Metabolites (Butyrate / SCFAs)',
      legendInflammation: 'Inflammatory stress (LPS / TNF-α)',
      legendTj: 'TJ Complexes (ZO-1 / Occludin)',
      legendFlux: 'Paracellular flux',
    },
    chart: {
      titlePrefix: 'Barrier Time-Course Dynamics',
      subtitle: 'Hover to inspect exact coordinates · Click to sync epithelial cross-section',
      tabBio: 'Biomarkers',
      tabOde: 'ODE States (A, I, TJ, V)',
      time: 'Time',
      teer: 'TEER',
      papp: 'Papp (FD4)',
      lmRatio: 'L/M Ratio',
      deltaPerm: 'Δ Permeability',
      ampkState: 'AMPK / HDACi A(t)',
      infState: 'Inflammation I(t)',
      tjState: 'TJ Integrity TJ(t)',
      viabState: 'Viability V(t)',
      axisTeer: 'TEER (Ω·cm²)',
      axisOdePct: 'A(t), V(t) (%)',
      axisPapp: 'Papp FD4 (10⁻⁶ cm/s)',
      axisOdeUnits: 'TJ(t), I(t) (a.u.)',
      leakyThreshold: 'Leaky Gut Alert Threshold (L/M = 0.05)',
      legendTeer: 'TEER (Ω·cm²) · Left axis',
      legendPapp: 'FD4 (10⁻⁶ cm/s) · Right axis',
      legendBaselineTeer: 'Basal TEER₀',
      legendAmpk: 'AMPK/HDACi activation A(t)',
      legendTj: 'TJ Integrity TJ(t)',
      legendInf: 'Inflammatory load I(t)',
      legendViab: 'Epithelial viability V(t)',
    },
    doseResponse: {
      title: 'Biphasic Dose-Response Curve (Butyrate Paradox)',
      subtitleStart: 'Patient-calibrated model (',
      subtitleMid: ') vs. in vitro Caco-2 reference (',
      subtitleEnd: ') at t =',
      luminalRange: 'Luminal range:',
      inspectedDose: 'Inspected dose',
      teerAndPapp: 'TEER &',
      optimalWindow: 'Patient optimal window',
      minPapp: 'Min',
      statusAtDose: 'Status at this dose',
      viability: 'Viability:',
      axisTeerPrefix: 'TEER at',
      axisPappPrefix: 'Papp FD4 at',
      legendActiveTeer: 'TEER (Active configuration)',
      legendActivePapp: 'FD4 (Active configuration)',
      legendRefInVitro: 'In Vitro Caco-2 Reference',
      clickHint: 'Click anywhere on the curve to apply that dose to the main simulator.',
    },
    scenariosView: {
      title: 'Multi-Scenario Benchmark Matrix (Validation at t = 48 h)',
      subtitle: 'Quantitative ODE benchmark (Caco-2 reference calibration: TEER₀ = 450.5 Ω·cm², P_app,0 = 0.60×10⁻⁶ cm/s) compared against your active configuration.',
      activeSimLabel: 'Active simulation (Current parameters)',
      activeSimDesc: 'Custom configuration currently loaded in the main simulator.',
      colScenario: 'Simulated scenario',
      colTj: 'TJ Integrity',
      colViability: 'Viability V',
      colTeer: 'TEER (Ω·cm²)',
      colDeltaTeer: 'ΔTEER',
      colPapp: 'FD4',
      colDeltaP: 'ΔP%',
      colLm: 'L/M Ratio',
      colStatus: 'Clinical status',
      colAction: 'Action',
      activeBadge: 'Active',
      loadBtn: 'Load',
    },
    modelSpec: {
      title: 'Mechanistic Mathematical Architecture (ODE System)',
      subtitle: '4th-order Runge-Kutta integration (high-resolution RK4, internal Δt = 0.02 h)',
      eq1Title: '1. AMPK / PKCβ2 Activation & HDAC Inhibition',
      eq1Note: 'captures attenuation across the mucus layer and colonocyte metabolism.',
      eq2Title: '2. Inflammatory Dynamics & "Leaky Gut" Feedback Loop',
      eq2Note: 'models paracellular endotoxin (LPS) translocation sustaining NF-κB signaling.',
      eq3Title: '3. Tight Junction Assembly & Disassembly (ZO-1 / Occludin)',
      eq4Title: '4. Epithelial Viability & High-Dose Cytotoxicity',
      eq5Title: '5. Biophysical Readouts (TEER, P_app FD4, L/M Ratio)',
      payloadTitle: 'DTHP Payload (Real-Time JSON)',
      payloadSubtitle: 'Ready for FastAPI service / MCMM microbiome coupling',
      copyJson: 'Copy JSON',
      copied: 'Copied',
      apiTitle: 'AI Agent Connector (MCP & REST API)',
      apiSubtitle: 'Deterministic RK4 solver endpoints for MCP agents and HTTP pipelines',
      testApiBtn: 'Test POST /api/simulate',
      testingApi: 'Running...',
      apiEndpointsLabel: 'Active HTTP Endpoints:',
      mcpStdioLabel: 'Stdio MCP Configuration (mcp-server.ts):',
    },
    disclaimer: {
      badge: 'Research Use Only',
      banner:
        'Theoretical in silico simulation platform for scientific research and educational purposes only. Model outputs do not constitute medical advice, clinical diagnosis, or treatment recommendations, and are not clinically validated. Always consult a qualified healthcare professional.',
      footer:
        'Legal Notice: Mechanistic modeling software provided "as is" for research and educational purposes only (not a certified medical device). The author disclaims all liability for any clinical, diagnostic, or medical decision-making use.',
    },
  },
};
