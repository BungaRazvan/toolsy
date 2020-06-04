import { BuildOptions, Model, Includeable } from "sequelize";

export interface GeneralSkins {
  readonly skin_name: string;
  readonly skin_image: string;
  readonly skin_quality: string;
  readonly skin_avaible: string;
}

export interface GeneralObject {
  [key: string]: any;
}

export interface CustomsSkins extends GeneralSkins, Knives, Skins {}

export interface Cases {
  readonly case_id: number;
  readonly case_name: string;
  readonly case_image: string;
}

export interface Skins extends GeneralSkins {
  readonly skin_id: number;
}

export interface Knives extends GeneralSkins {
  readonly knife_id: number;
}

export interface KnifeCases {
  readonly id: number;
  readonly case_id: number;
  readonly knife_id: number;
}

export interface Players {
  readonly id: number;
  readonly player_id: string;
}

export interface Inventory {
  readonly id: number;
  readonly player_id: string;
  readonly quantity: number;
  readonly skin_id: number;
  readonly knife_id: number;
}

export type StaticSkins = typeof Model & {
  new (values?: object, options?: BuildOptions): Skins;
};
export type StaticCases = typeof Model & {
  new (values?: object, options?: BuildOptions): Cases;
};

export type StaticKnives = typeof Model & {
  new (values?: object, options?: BuildOptions): Knives;
};

export type StatiKnifeCases = typeof Model & {
  new (values?: object, options?: BuildOptions): KnifeCases;
};

export type StaticPlayers = typeof Model & {
  new (values?: object, options?: BuildOptions): Players;
};

export type StaticInvertory = typeof Model & {
  new (values?: object, options?: BuildOptions): Inventory;
};
