import { BaseEntity, Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class ProjectEntity extends BaseEntity {

    @PrimaryColumn()
    id?: string;

    @Column()
    name?: string;

    @Column()
    date_created?: Date;

}