import Alpine from '../alpine'

Alpine.magic('refs', el => el.__x__closestRoot().__x__$refs || {})
