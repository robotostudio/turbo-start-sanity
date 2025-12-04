import { Stack } from '@sanity/ui'
import {ArrayOfObjectsInputProps} from 'sanity'
import styled from 'styled-components'

const ArrayGridPreviewFullBleed = styled(Stack)`
    margin: 0 -10rem;


`

export default function ArrayGridPreview(props: ArrayOfObjectsInputProps) {
  return (
    <ArrayGridPreviewFullBleed>
      {props.renderDefault(props)}
    </ArrayGridPreviewFullBleed>
  )
}