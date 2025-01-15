import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { ProjectEntity } from "./ProjectEntity";

@Entity()
export class FileEntity extends BaseEntity {

    @PrimaryColumn()
    id?: string;

    @Column()
    name!: string;

    @Column()
    path!: string;

    @ManyToOne(() => ProjectEntity)
    project!: ProjectEntity;

    @Column({type: "bigint"})
    last_modified!: number;

    @Column()
    size: number = 0;

    @Column()
    is_deleted: boolean = false;

    @Column()
    is_uploaded: boolean = false;

}