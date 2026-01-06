import * as groupFns from './groups.js'
import * as userFns from './users.js'

const allFns = { ...groupFns, ...userFns }
export default allFns
