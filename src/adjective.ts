import {
	Article,
	WithArticleArgs,
	withArticleMixin,
	WithArticleType,
} from './article';
import {
	Declinable,
	DeclinableArgs,
	declinableMixin,
	Gender,
	GrammaticalCase,
	GrammaticalNumber,
} from './declinable';
import { Writable } from './textHelper';
import { variantPicker } from './variants';

export function isAdjective(obj: any): obj is Adjective {
	return (obj as Adjective).gender !== undefined;
}
export interface Adjective
	extends Declinable<Adjective>,
		WithArticleType<Adjective>,
		Writable {
	gender: (gender: Gender) => this;
}

export function adjective(template: string): Adjective {
	/**
	 * removes e at the end
	 * e.g. leise => leis
	 * 	  teuer => teur
	 */
	let stem = template.replace(/e([rl]?)$/, '$1');

	/**
	 * hoch => hoh
	 */
	stem = stem.replace(/ch$/, 'h');

	function decline({
		articleType = 'definite',
		gender = 'n',
		grammaticalCase = 'nominative',
		grammaticalNumber = 's',
	}: {
		grammaticalCase?: GrammaticalCase;
		grammaticalNumber?: GrammaticalNumber;
		gender?: Gender;
		articleType?: Article;
	}) {
		if (grammaticalNumber === 'p') {
			if (articleType !== 'none' || grammaticalCase === 'dative')
				return stem + 'en';
			if (grammaticalCase === 'nominative' || grammaticalCase === 'accusative')
				return stem + 'e';
			return stem + 'r';
		}
		if (gender === 'f') {
			if (grammaticalCase === 'nominative' || grammaticalCase === 'accusative')
				return stem + 'e';
			if (articleType === 'none') return stem + 'er';
			return stem + 'en';
		}
		if (gender === 'm') {
			if (grammaticalCase === 'accusative' || grammaticalCase === 'genitive')
				return stem + 'en';
			if (grammaticalCase === 'dative') {
				if (articleType === 'none') return stem + 'em';
				return stem + 'en';
			}
			if (articleType === 'definite') return stem + 'e';
			return stem + 'er';
		}
		if (gender === 'n') {
			if (grammaticalCase === 'genitive') return stem + 'en';
			if (grammaticalCase === 'dative') {
				if (articleType === 'none') return stem + 'em';
				return stem + 'en';
			}
			if (articleType === 'definite') return stem + 'e';
			return stem + 'es';
		}
		return '';
	}

	const create = adjectiveFactory((args) => ({
		write() {
			return decline(args);
		},
	}));
	return create();
}

export function adjectiveSynonyms(...adjectives: Adjective[]): Adjective {
	const next = variantPicker(adjectives);
	const create = adjectiveFactory(
		({ articleType, gender, grammaticalCase, grammaticalNumber }) => ({
			write() {
				let adj = next();
				if (articleType) adj = adj.article(articleType);
				if (gender) adj = adj.gender(gender);
				if (grammaticalCase) adj = adj[grammaticalCase]();
				if (grammaticalNumber)
					adj = grammaticalNumber === 'p' ? adj.plural() : adj.singular();
				return adj.write();
			},
		})
	);
	return create();
}

type AdjectiveArgs = {
	gender?: Gender;
} & DeclinableArgs &
	WithArticleArgs;

export function adjectiveFactory(
	writable: (args: AdjectiveArgs) => Writable
): (args?: AdjectiveArgs) => Adjective {
	return function create(args: AdjectiveArgs = {}): Adjective {
		return {
			gender(g) {
				return create({ ...args, gender: g });
			},
			...withArticleMixin(create)(args),
			...declinableMixin(create)(args),
			...writable({ ...args }),
		};
	};
}