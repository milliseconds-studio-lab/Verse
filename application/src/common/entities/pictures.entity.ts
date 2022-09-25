import { Column, Entity } from 'typeorm'
import { IsNumber, IsOptional, IsString } from 'class-validator'
import { CoreEntity } from './core.entity'

@Entity({ name: 'Pictures' })
export default class PicturesEntity extends CoreEntity {
  @Column({ type: 'varchar', nullable: false, default: '' })
  @IsString()
  name: string

  @Column({ type: 'varchar', nullable: false, default: '' })
  @IsString()
  stored_name: string

  @Column({ type: 'int', nullable: true })
  @IsNumber()
  @IsOptional()
  width: number

  @Column({ type: 'int', nullable: true })
  @IsNumber()
  @IsOptional()
  height: number
}