import { Entity } from "../../Entities";

export interface Sequence {
    name: string,
    lifetime: number,
    entities: []
}