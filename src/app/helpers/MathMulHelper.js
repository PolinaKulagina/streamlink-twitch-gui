import { Helper } from "ember";


function mathMul( valueA, valueB ) {
	return valueA * valueB;
}


export default Helper.helper(function( params ) {
	return params.reduce( mathMul );
});
