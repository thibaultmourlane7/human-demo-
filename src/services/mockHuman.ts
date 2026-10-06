import type { DemoCategory, DemoExpert, DemoRequest, DemoRequestInput } from '../domain/request';

const EXPERTS: Record<DemoCategory, DemoExpert> = {
  legal: {
    id: 'expert-legal-demo',
    displayName: 'Maître L. — profil démo',
    profession: 'Avocat',
    specialty: 'Droit français',
    verified: true,
    etaMinutes: 12,
  },
  accounting: {
    id: 'expert-accounting-demo',
    displayName: 'C. Martin — profil démo',
    profession: 'Expert-comptable',
    specialty: 'Comptabilité française',
    verified: true,
    etaMinutes: 15,
  },
  tax: {
    id: 'expert-tax-demo',
    displayName: 'A. Bernard — profil démo',
    profession: 'Fiscaliste',
    specialty: 'Fiscalité française',
    verified: true,
    etaMinutes: 18,
  },
  development: {
    id: 'expert-dev-demo',
    displayName: 'N. Dubois — profil démo',
    profession: 'Développeur senior',
    specialty: 'Développement logiciel',
    verified: true,
    etaMinutes: 8,
  },
};

export function createDemoRequest(input: DemoRequestInput): DemoRequest {
  return {
    ...input,
    id: `demo-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
    status: 'searching',
  };
}

export function matchDemoExpert(request: DemoRequest): DemoRequest {
  return {
    ...request,
    status: 'accepted',
    expert: EXPERTS[request.category],
  };
}

export function answerDemoRequest(request: DemoRequest): DemoRequest {
  if (!request.expert) {
    throw new Error('Aucun expert sélectionné pour cette demande de démonstration.');
  }

  return {
    ...request,
    status: 'answered',
    answer:
      "Réponse de démonstration : l'expert humain a relu la question et transmet ici son avis. Dans la vraie version, ce contenu proviendra uniquement de l'expert sélectionné et sera journalisé côté privé.",
  };
}
